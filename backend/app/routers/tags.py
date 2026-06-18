import uuid
import logging
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status

from app.config import settings
from app.database import db_manager
from app.schemas import NFCTagResponse, NFCTagCreate
from app.routers.auth import get_current_user

logger = logging.getLogger("retail_backend")

router = APIRouter(prefix="/api/tags", tags=["NFC Tags"])

@router.get("", response_model=List[NFCTagResponse])
async def get_all_tags(current_user: dict = Depends(get_current_user)):
    tags_container = db_manager.get_container(settings.CONTAINER_TAGS)
    query = "SELECT * FROM c"
    iterator = tags_container.query_items(query=query, enable_cross_partition_query=True)
    
    tags = []
    async for t in iterator:
        tags.append(NFCTagResponse(**t))
    return tags

@router.get("/store/{store_id}", response_model=List[NFCTagResponse])
async def get_tags_by_store(store_id: str, current_user: dict = Depends(get_current_user)):
    tags_container = db_manager.get_container(settings.CONTAINER_TAGS)
    query = "SELECT * FROM c WHERE c.storeId = @storeId"
    params = [{"name": "@storeId", "value": store_id}]
    iterator = tags_container.query_items(query=query, parameters=params, enable_cross_partition_query=True)
    
    tags = []
    async for t in iterator:
        tags.append(NFCTagResponse(**t))
    return tags

@router.post("/register", response_model=NFCTagResponse)
async def register_tag(tag_in: NFCTagCreate, store_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can register NFC tags"
        )
        
    tags_container = db_manager.get_container(settings.CONTAINER_TAGS)
    
    # Check if tag already exists in this store
    query = "SELECT * FROM c WHERE c.uid = @uid AND c.storeId = @storeId"
    params = [{"name": "@uid", "value": tag_in.uid}, {"name": "@storeId", "value": store_id}]
    iterator = tags_container.query_items(query=query, parameters=params, enable_cross_partition_query=True)
    
    async for t in iterator:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"NFC tag with UID {tag_in.uid} already registered for store {store_id}"
        )
        
    tag_doc = {
        "id": f"tag-{uuid.uuid4().hex[:8]}" if not db_manager.use_mock else f"t{len(tags_container.items) + 1}",
        "uid": tag_in.uid,
        "location": tag_in.location,
        "area": tag_in.area,
        "floor": tag_in.floor,
        "zone": tag_in.zone,
        "priority": tag_in.priority,
        "status": "active",
        "storeId": store_id,
        "registeredAt": datetime.now().strftime("%b %d, %Y"),
        "notes": tag_in.notes
    }
    
    await tags_container.create_item(tag_doc)
    
    # Increment nfcCount on store
    stores_container = db_manager.get_container(settings.CONTAINER_STORES)
    try:
        store = await stores_container.read_item(store_id, partition_key=store_id)
        store["nfcCount"] = store.get("nfcCount", 0) + 1
        await stores_container.upsert_item(store)
    except Exception as e:
        logger.error(f"Failed to increment store nfcCount: {e}")
        
    return NFCTagResponse(**tag_doc)

@router.put("/{tag_id}/status", response_model=NFCTagResponse)
async def update_tag_status(tag_id: str, store_id: str, new_status: str, current_user: dict = Depends(get_current_user)):
    tags_container = db_manager.get_container(settings.CONTAINER_TAGS)
    try:
        tag = await tags_container.read_item(tag_id, partition_key=store_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tag {tag_id} not found"
        )
        
    tag["status"] = new_status
    await tags_container.upsert_item(tag)
    return NFCTagResponse(**tag)
