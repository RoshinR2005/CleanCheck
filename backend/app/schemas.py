from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal

# Auth Schemas
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: Literal["admin", "cleaner"]
    storeId: str
    shift: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: str
    storeId: str
    shift: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# Store Schemas
class ComplianceHistoryItem(BaseModel):
    hour: str
    done: int
    missed: int

class StoreResponse(BaseModel):
    id: str
    name: str
    storeNumber: str
    location: str
    manager: str
    compliance: int
    nfcCount: int
    activeAlerts: int
    lastSync: str
    complianceHistory: List[ComplianceHistoryItem] = []

class StoreCreate(BaseModel):
    name: str
    storeNumber: str
    location: str
    manager: str

# NFC Tag Schemas
class NFCTagCreate(BaseModel):
    uid: str
    location: str
    area: str
    floor: str
    zone: str
    priority: Literal["high", "medium", "low"]
    notes: Optional[str] = None

class NFCTagResponse(BaseModel):
    id: str
    uid: str
    location: str
    area: str
    floor: str
    zone: str
    priority: str
    status: str
    storeId: str
    lastScanned: Optional[str] = None
    registeredAt: Optional[str] = None
    notes: Optional[str] = None

# Scan Schemas
class ScanRequest(BaseModel):
    uid: str
    storeId: str
    staff: str
    latitude: float
    longitude: float
    accuracy: Optional[float] = None

class ScanLogResponse(BaseModel):
    id: str
    location: str
    time: str
    status: str
    nfcUid: str
    staff: str
    compliance: int

# Round Schemas
class RoundResponse(BaseModel):
    id: str
    storeId: str
    name: str
    time: str
    staff: str
    compliance: int
    totalScans: int
    completedScans: int
    scans: List[ScanLogResponse] = []

# Alert Schemas
class AlertResponse(BaseModel):
    id: str
    storeId: str
    type: Literal["critical", "warning", "fraud"]
    category: Literal["missing-round", "duplicate-scan", "gps-mismatch", "low-compliance", "too-quick"]
    title: str
    description: str
    time: str
    location: Optional[str] = None
    staff: Optional[str] = None
    status: Literal["active", "resolved"] = "active"

class AlertUpdate(BaseModel):
    status: Literal["active", "resolved"]
