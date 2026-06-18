import uuid
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.config import settings
from backend.app.database import db_manager
from backend.app.schemas import ScanRequest, ScanLogResponse, RoundResponse
from backend.app.routers.auth import get_current_user
from backend.app.services import (
    get_active_round_for_store,
    evaluate_scan_fraud_and_rules,
    update_store_compliance_rating
)

logger = logging.getLogger("retail_backend")

router = APIRouter(prefix="/api/scans", tags=["Scans"])

@router.post("", response_model=RoundResponse)
async def process_nfc_scan(scan_in: ScanRequest, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "cleaner" and current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized role for scanning"
        )
        
    tags_container = db_manager.get_container(settings.CONTAINER_TAGS)
    rounds_container = db_manager.get_container(settings.CONTAINER_ROUNDS)
    stores_container = db_manager.get_container(settings.CONTAINER_STORES)
    
    # 1. Fetch Tag Info
    query_tag = "SELECT * FROM c WHERE c.uid = @uid AND c.storeId = @storeId"
    params_tag = [{"name": "@uid", "value": scan_in.uid}, {"name": "@storeId", "value": scan_in.storeId}]
    iterator_tag = tags_container.query_items(query=query_tag, parameters=params_tag, enable_cross_partition_query=True)
    
    tag = None
    async for t in iterator_tag:
        tag = t
        break
        
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"NFC Tag with UID {scan_in.uid} is not registered at store {scan_in.storeId}"
        )
        
    if tag.get("status") == "deactivated":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="NFC Tag is deactivated"
        )

    # 2. Run Compliance / Fraud Check Engine
    rules_evaluation = await evaluate_scan_fraud_and_rules(
        uid=scan_in.uid,
        store_id=scan_in.storeId,
        staff=scan_in.staff,
        lat=scan_in.latitude,
        lon=scan_in.longitude
    )

    # Determine Scan Status
    scan_status = "verified"
    if not rules_evaluation["gps_valid"]:
        scan_status = "error" # Mark as error due to GPS mismatch
    elif rules_evaluation["duplicate"]:
        scan_status = "error" # Mark as error due to duplicate scan limit

    # Get count of total active tags in store to establish compliance denominator
    query_all_active_tags = "SELECT VALUE COUNT(1) FROM c WHERE c.storeId = @storeId AND c.status = 'active'"
    iterator_count = tags_container.query_items(query=query_all_active_tags, parameters=[{"name": "@storeId", "value": scan_in.storeId}], enable_cross_partition_query=True)
    total_tags_count = 0
    async for count in iterator_count:
        total_tags_count = count
        break
    if total_tags_count == 0:
        total_tags_count = 12 # Default fallback matching FreshMart superstore if container is empty
        
    # 3. Handle Active Round fetching/creation
    active_round = await get_active_round_for_store(scan_in.storeId)
    now_dt = datetime.now()
    now_str = now_dt.strftime("%I:%M %p")
    
    # If no round or latest round was created hours ago, let's create a new one.
    create_new = False
    if not active_round:
        create_new = True
    else:
        # If the active round is fully completed (all tags scanned) and it's been a while, create a new round
        completed_scans = [s for s in active_round.get("scans", []) if s.get("status") == "verified"]
        if len(completed_scans) >= total_tags_count:
            create_new = True
        else:
            # Check time delta from round time. If > 2 hours, start a new round
            try:
                r_time = datetime.strptime(active_round["time"], "%I:%M %p").replace(
                    year=now_dt.year, month=now_dt.month, day=now_dt.day
                )
                if (now_dt - r_time).total_seconds() > 7200:
                    create_new = True
            except Exception:
                create_new = True
                
    if create_new:
        # Determine round name (e.g. Round #1, #2, #3 based on existing count)
        query_all_rounds = "SELECT * FROM c WHERE c.storeId = @storeId"
        iterator_all = rounds_container.query_items(query=query_all_rounds, parameters=[{"name": "@storeId", "value": scan_in.storeId}], enable_cross_partition_query=True)
        rounds_today = []
        async for r in iterator_all:
            rounds_today.append(r)
        
        round_number = len(rounds_today) + 1
        active_round = {
            "id": f"round-{uuid.uuid4().hex[:8]}" if not db_manager.use_mock else f"r{len(rounds_today) + 1}",
            "storeId": scan_in.storeId,
            "name": f"Morning Round #{round_number}" if now_dt.hour < 12 else f"Afternoon Round #{round_number}",
            "time": now_str,
            "staff": scan_in.staff,
            "compliance": 0,
            "totalScans": total_tags_count,
            "completedScans": 0,
            "scans": []
        }
        await rounds_container.create_item(active_round)

    # 4. Insert Scan Log Item
    scan_log = {
        "id": f"scan-{uuid.uuid4().hex[:8]}",
        "location": tag["location"],
        "time": now_str,
        "status": scan_status,
        "nfcUid": scan_in.uid,
        "staff": scan_in.staff,
        "compliance": 100 if scan_status == "verified" else 0
    }
    
    # Check if this tag has already been successfully scanned in this round
    already_scanned = any(s.get("nfcUid") == scan_in.uid and s.get("status") == "verified" for s in active_round["scans"])
    
    if not already_scanned or scan_status == "error":
        active_round["scans"].append(scan_log)

    # Recalculate Round compliance
    verified_scans_count = len([s for s in active_round["scans"] if s["status"] == "verified"])
    active_round["completedScans"] = len(active_round["scans"])
    active_round["compliance"] = int((verified_scans_count / active_round["totalScans"]) * 100)
    
    # Upsert the round document
    await rounds_container.upsert_item(active_round)

    # 5. Update Tag metadata (lastScanned)
    tag["lastScanned"] = now_str
    if scan_status == "error":
        tag["status"] = "error"
    else:
        tag["status"] = "active"
    await tags_container.upsert_item(tag)

    # 6. Recalculate Store compliance rating
    await update_store_compliance_rating(scan_in.storeId)

    return RoundResponse(**active_round)
