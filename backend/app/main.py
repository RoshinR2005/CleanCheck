from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import db_manager
from app.routers import auth, stores, tags, scans, alerts

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup connection to database
    await db_manager.connect()
    yield
    # Safely close client connections
    await db_manager.close()

app = FastAPI(
    title="CleanCheck NFC Compliance API",
    description="Asynchronous FastAPI service for managing NFC-based retail cleaning compliance and fraud prevention.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for Flutter client compatibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include application routers
app.include_router(auth.router)
app.include_router(stores.router)
app.include_router(tags.router)
app.include_router(scans.router)
app.include_router(alerts.router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "CleanCheck NFC Compliance API",
        "mock_mode": db_manager.use_mock
    }

@app.get("/health/db")
async def check_db_connection():
    """Check if database is connected and healthy."""
    is_connected = db_manager.client is not None or db_manager.use_mock
    containers_initialized = len(db_manager.containers) > 0
    
    return {
        "status": "connected" if is_connected and containers_initialized else "disconnected",
        "is_connected": is_connected,
        "containers_initialized": containers_initialized,
        "container_count": len(db_manager.containers),
        "use_mock": db_manager.use_mock,
        "mode": "mock_database" if db_manager.use_mock else "cosmos_db"
    }
