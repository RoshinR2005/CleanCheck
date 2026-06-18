import math
import uuid
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from app.config import settings
from app.database import db_manager

logger = logging.getLogger("retail_backend")

# Expected coordinates for seeded tags to check GPS mismatch
# In production, these would be saved inside the tag document metadata.
TAG_COORDINATES: Dict[str, Dict[str, float]] = {
    "04:A3:7F": {"lat": 12.9716, "lon": 77.5946}, # Produce Section
    "04:B2:3C": {"lat": 12.9717, "lon": 77.5947}, # Bakery Section
    "04:C4:5E": {"lat": 12.9718, "lon": 77.5948}, # Dairy
    "04:D5:6F": {"lat": 12.9719, "lon": 77.5949}, # Meat
    "04:E6:7G": {"lat": 12.9720, "lon": 77.5950}, # Restrooms
    "04:F7:8H": {"lat": 12.9721, "lon": 77.5951}, # Checkout
    "04:G8:9I": {"lat": 12.9722, "lon": 77.5952}, # Beverages
    "04:H9:0J": {"lat": 12.9723, "lon": 77.5953}, # Frozen Foods
    "04:I0:1K": {"lat": 12.9724, "lon": 77.5954}, # Break Room
    "04:J1:2L": {"lat": 12.9725, "lon": 77.5955}, # Loading Dock
    "04:K2:3M": {"lat": 12.9726, "lon": 77.5956}, # Manager's Office
    "04:L3:4N": {"lat": 12.9727, "lon": 77.5957}, # Deli Counter
}

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points in meters."""
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

async def get_active_round_for_store(store_id: str) -> Optional[Dict[str, Any]]:
    """Query the database to find the currently active round for a store."""
    rounds_container = db_manager.get_container(settings.CONTAINER_ROUNDS)
    query = "SELECT * FROM c WHERE c.storeId = @storeId"
    params = [{"name": "@storeId", "value": store_id}]
    
    iterator = rounds_container.query_items(query=query, parameters=params, enable_cross_partition_query=True)
    
    rounds = []
    async for r in iterator:
        rounds.append(r)
        
    if not rounds:
        return None
        
    # Sort rounds by time and get the latest
    rounds.sort(key=lambda x: x.get("time", ""), reverse=True)
    latest_round = rounds[0]
    
    # If a round is completed (all scans accounted or manually closed), we return None or the active one
    # For now, let's treat the latest round as the active round
    return latest_round

async def create_alert(store_id: str, type_str: str, category: str, title: str, description: str, location: Optional[str] = None, staff: Optional[str] = None):
    """Create a compliance or fraud alert document."""
    alerts_container = db_manager.get_container(settings.CONTAINER_ALERTS)
    alert_doc = {
        "id": f"alert-{uuid.uuid4().hex[:8]}",
        "storeId": store_id,
        "type": type_str,
        "category": category,
        "title": title,
        "description": description,
        "time": datetime.now().strftime("%I:%M %p"),
        "location": location,
        "staff": staff,
        "status": "active"
    }
    await alerts_container.create_item(alert_doc)
    logger.warning(f"ALERT CREATED: {title} ({type_str.upper()})")
    
    # Increment active alerts on store
    stores_container = db_manager.get_container(settings.CONTAINER_STORES)
    try:
        store = await stores_container.read_item(store_id, partition_key=store_id)
        store["activeAlerts"] = store.get("activeAlerts", 0) + 1
        await stores_container.upsert_item(store)
    except Exception as e:
        logger.error(f"Failed to increment store activeAlerts count: {e}")

async def evaluate_scan_fraud_and_rules(
    uid: str, store_id: str, staff: str, lat: float, lon: float
) -> Dict[str, Any]:
    """Verify GPS validity, check duplication and scan frequency anomalies."""
    results = {"gps_valid": True, "duplicate": False, "too_quick": False}
    
    # 1. GPS Check
    # Match against standard coordinates for compliance
    expected = TAG_COORDINATES.get(uid)
    if expected:
        dist = haversine_distance(lat, lon, expected["lat"], expected["lon"])
        if dist > 30.0:  # 30 meters threshold
            results["gps_valid"] = False
            await create_alert(
                store_id=store_id,
                type_str="fraud",
                category="gps-mismatch",
                title=f"GPS Mismatch – Tag {uid}",
                description=f"Scan recorded by {staff} at tag {uid} is {int(dist)}m away from registered coordinates.",
                location=uid,
                staff=staff
            )
            
    # 2. Duplicate Scan Check (within 30 minutes)
    rounds_container = db_manager.get_container(settings.CONTAINER_ROUNDS)
    # Search for latest scan of this specific tag uid in rounds today
    query = "SELECT * FROM c WHERE c.storeId = @storeId"
    params = [{"name": "@storeId", "value": store_id}]
    
    iterator = rounds_container.query_items(query=query, parameters=params, enable_cross_partition_query=True)
    
    now_dt = datetime.now()
    duplicate_window = timedelta(minutes=30)
    
    async for r in iterator:
        for scan in r.get("scans", []):
            if scan.get("nfcUid") == uid and scan.get("status") == "verified":
                try:
                    scan_time = datetime.strptime(scan["time"], "%I:%M %p").replace(
                        year=now_dt.year, month=now_dt.month, day=now_dt.day
                    )
                    # Handle PM/AM wraps safely
                    if abs((now_dt - scan_time).total_seconds()) < duplicate_window.total_seconds():
                        results["duplicate"] = True
                        await create_alert(
                            store_id=store_id,
                            type_str="warning",
                            category="duplicate-scan",
                            title="Duplicate Scan Alert",
                            description=f"Tag {uid} scanned by {staff} again too quickly (under 30 min since last scan).",
                            location=uid,
                            staff=staff
                        )
                        break
                except Exception:
                    pass
        if results["duplicate"]:
            break

    # 3. Scan duration speed limit (under 15 mins total check)
    active_round = await get_active_round_for_store(store_id)
    if active_round:
        completed_scans = [s for s in active_round.get("scans", []) if s.get("status") == "verified"]
        if len(completed_scans) >= 2:
            # Check elapsed time between first scan and now
            try:
                first_scan_time = datetime.strptime(completed_scans[0]["time"], "%I:%M %p").replace(
                    year=now_dt.year, month=now_dt.month, day=now_dt.day
                )
                elapsed_mins = (now_dt - first_scan_time).total_seconds() / 60.0
                if len(completed_scans) >= 5 and elapsed_mins < 12.0:
                    results["too_quick"] = True
                    await create_alert(
                        store_id=store_id,
                        type_str="warning",
                        category="too-quick",
                        title="Round Too Quick",
                        description=f"Round {active_round.get('name')} completed by {staff} too quickly ({int(elapsed_mins)} mins). Scans may not match physical presence.",
                        staff=staff
                    )
            except Exception:
                pass

    return results

async def update_store_compliance_rating(store_id: str):
    """Recalculate overall compliance score for a store based on today's rounds."""
    rounds_container = db_manager.get_container(settings.CONTAINER_ROUNDS)
    query = "SELECT * FROM c WHERE c.storeId = @storeId"
    params = [{"name": "@storeId", "value": store_id}]
    
    iterator = rounds_container.query_items(query=query, parameters=params, enable_cross_partition_query=True)
    
    rounds = []
    async for r in iterator:
        rounds.append(r)
        
    if not rounds:
        return
        
    avg_compliance = int(sum(r.get("compliance", 100) for r in rounds) / len(rounds))
    
    stores_container = db_manager.get_container(settings.CONTAINER_STORES)
    try:
        store = await stores_container.read_item(store_id, partition_key=store_id)
        store["compliance"] = avg_compliance
        await stores_container.upsert_item(store)
    except Exception as e:
        logger.error(f"Failed to update store compliance: {e}")
