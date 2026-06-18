import logging
import uuid
from datetime import datetime, timedelta
from typing import Optional
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext

from app.config import settings
from app.database import db_manager
from app.schemas import UserLogin, UserCreate, UserResponse, Token

logger = logging.getLogger("retail_backend")

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login_oauth2")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm="HS256")
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    users_container = db_manager.get_container(settings.CONTAINER_USERS)
    try:
        user = await users_container.read_item(email, partition_key=email)
        return user
    except Exception:
        raise credentials_exception

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    users_container = db_manager.get_container(settings.CONTAINER_USERS)
    try:
        user = await users_container.read_item(credentials.email, partition_key=credentials.email)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
        
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
        
    access_token = create_access_token(
        data={"sub": user["email"], "role": user["role"], "storeId": user["storeId"]}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=UserResponse)
async def register(user_in: UserCreate):
    users_container = db_manager.get_container(settings.CONTAINER_USERS)
    
    # Check if user already exists
    try:
        await users_container.read_item(user_in.email, partition_key=user_in.email)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    except Exception:
        pass # Expecting 404 Not Found here
        
    user_doc = {
        "id": f"u-{uuid.uuid4().hex[:8]}" if not db_manager.use_mock else f"u{len(users_container.items) + 1}",
        "email": user_in.email,
        "name": user_in.name,
        "password_hash": get_password_hash(user_in.password),
        "role": user_in.role,
        "storeId": user_in.storeId,
        "shift": user_in.shift
    }
    
    await users_container.create_item(user_doc)
    return UserResponse(**user_doc)

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        role=current_user["role"],
        storeId=current_user["storeId"],
        shift=current_user.get("shift")
    )
