import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status

from app.config import settings
from app.database import db_manager
from app.schemas import AlertResponse, AlertUpdate
from app.routers.auth import get_current_user

logger = logging.getLogger("retail_backend")

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertResponse])
async def get_alerts(store_id: Optional[str] = None, status_filter: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    alerts_container = db_manager.get_container(settings.CONTAINER_ALERTS)
    
    query = "SELECT * FROM c"
    params = []
    
    conditions = []
    if store_id:
        conditions.append("c.storeId = @storeId")
        params.append({"name": "@storeId", "value": store_id})
        
    if status_filter:
        conditions.append("c.status = @status")
        params.append({"name": "@status", "value": status_filter})
        
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
        
    query += " ORDER BY c.time DESC"
    
    iterator = alerts_container.query_items(query=query, parameters=params, enable_cross_partition_query=True)
    
    alerts = []
    async for a in iterator:
        alerts.append(AlertResponse(**a))
    return alerts

@router.put("/{alert_id}/status", response_model=AlertResponse)
async def update_alert_status(alert_id: str, store_id: str, alert_update: AlertUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can update alert status"
        )
        
    alerts_container = db_manager.get_container(settings.CONTAINER_ALERTS)
    try:
        alert = await alerts_container.read_item(alert_id, partition_key=store_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert {alert_id} not found"
        )
        
    old_status = alert.get("status")
    alert["status"] = alert_update.status
    await alerts_container.upsert_item(alert)
    
    # If resolving, decrement activeAlerts on store
    if old_status == "active" and alert_update.status == "resolved":
        stores_container = db_manager.get_container(settings.CONTAINER_STORES)
        try:
            store = await stores_container.read_item(store_id, partition_key=store_id)
            store["activeAlerts"] = max(0, store.get("activeAlerts", 1) - 1)
            await stores_container.upsert_item(store)
        except Exception as e:
            logger.error(f"Failed to decrement store activeAlerts count: {e}")
            
    return AlertResponse(**alert)
