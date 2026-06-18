import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status

from app.config import settings
from app.database import db_manager
from app.schemas import StoreResponse, RoundResponse
from app.routers.auth import get_current_user

logger = logging.getLogger("retail_backend")

router = APIRouter(prefix="/api/stores", tags=["Stores"])

@router.get("", response_model=List[StoreResponse])
async def get_stores(current_user: dict = Depends(get_current_user)):
    stores_container = db_manager.get_container(settings.CONTAINER_STORES)
    query = "SELECT * FROM c"
    iterator = stores_container.query_items(query=query, enable_cross_partition_query=True)
    
    stores = []
    async for s in iterator:
        stores.append(StoreResponse(**s))
    return stores

@router.get("/{store_id}", response_model=StoreResponse)
async def get_store_by_id(store_id: str, current_user: dict = Depends(get_current_user)):
    stores_container = db_manager.get_container(settings.CONTAINER_STORES)
    try:
        store = await stores_container.read_item(store_id, partition_key=store_id)
        return StoreResponse(**store)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Store {store_id} not found"
        )

@router.get("/{store_id}/dashboard", response_model=Dict[str, Any])
async def get_store_dashboard(store_id: str, current_user: dict = Depends(get_current_user)):
    # Pull Store Info
    stores_container = db_manager.get_container(settings.CONTAINER_STORES)
    try:
        store_data = await stores_container.read_item(store_id, partition_key=store_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Store {store_id} not found"
        )

    # Pull active alerts count and list
    alerts_container = db_manager.get_container(settings.CONTAINER_ALERTS)
    query_alerts = "SELECT * FROM c WHERE c.storeId = @storeId AND c.status = 'active'"
    params_alerts = [{"name": "@storeId", "value": store_id}]
    iterator_alerts = alerts_container.query_items(query=query_alerts, parameters=params_alerts, enable_cross_partition_query=True)
    alerts = []
    async for a in iterator_alerts:
        alerts.append(a)

    # Pull tags list
    tags_container = db_manager.get_container(settings.CONTAINER_TAGS)
    query_tags = "SELECT * FROM c WHERE c.storeId = @storeId"
    params_tags = [{"name": "@storeId", "value": store_id}]
    iterator_tags = tags_container.query_items(query=query_tags, parameters=params_tags, enable_cross_partition_query=True)
    tags = []
    async for t in iterator_tags:
        tags.append(t)

    # Pull rounds list
    rounds_container = db_manager.get_container(settings.CONTAINER_ROUNDS)
    query_rounds = "SELECT * FROM c WHERE c.storeId = @storeId"
    params_rounds = [{"name": "@storeId", "value": store_id}]
    iterator_rounds = rounds_container.query_items(query=query_rounds, parameters=params_rounds, enable_cross_partition_query=True)
    rounds = []
    async for r in iterator_rounds:
        rounds.append(r)
        
    rounds.sort(key=lambda x: x.get("time", ""), reverse=True)

    return {
        "store": StoreResponse(**store_data),
        "activeAlertsCount": len(alerts),
        "alerts": alerts,
        "nfcCount": len(tags),
        "tags": tags,
        "rounds": rounds
    }

@router.get("/{store_id}/rounds", response_model=List[RoundResponse])
async def get_store_rounds(store_id: str, current_user: dict = Depends(get_current_user)):
    rounds_container = db_manager.get_container(settings.CONTAINER_ROUNDS)
    query = "SELECT * FROM c WHERE c.storeId = @storeId"
    params = [{"name": "@storeId", "value": store_id}]
    iterator = rounds_container.query_items(query=query, parameters=params, enable_cross_partition_query=True)
    
    rounds = []
    async for r in iterator:
        rounds.append(RoundResponse(**r))
        
    rounds.sort(key=lambda x: x.get("time", ""), reverse=True)
    return rounds
