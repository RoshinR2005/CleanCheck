import logging
import uuid
from typing import Dict, List, Any, Optional
from azure.cosmos.aio import CosmosClient
from azure.cosmos import PartitionKey
from azure.cosmos.exceptions import CosmosHttpResponseError, CosmosResourceExistsError

from app.config import settings

logger = logging.getLogger("retail_backend")
logging.basicConfig(level=logging.INFO)

class MockContainer:
    """Mock container representing Cosmos DB container behavior in-memory."""
    def __init__(self, name: str):
        self.name = name
        self.items: Dict[str, Dict[str, Any]] = {}

    async def read_item(self, item: str, partition_key: str) -> Dict[str, Any]:
        if item in self.items:
            return self.items[item]
        raise CosmosHttpResponseError(status_code=404, message="Not Found")

    async def create_item(self, body: Dict[str, Any]) -> Dict[str, Any]:
        if "id" not in body:
            body["id"] = str(uuid.uuid4())
        if body["id"] in self.items:
            raise CosmosResourceExistsError(status_code=409, message="Resource Exists")
        self.items[body["id"]] = body
        return body

    async def upsert_item(self, body: Dict[str, Any]) -> Dict[str, Any]:
        if "id" not in body:
            body["id"] = str(uuid.uuid4())
        self.items[body["id"]] = body
        return body

    async def delete_item(self, item: str, partition_key: str) -> None:
        if item in self.items:
            del self.items[item]
        else:
            raise CosmosHttpResponseError(status_code=404, message="Not Found")

    def query_items(self, query: str, parameters: Optional[List[Dict[str, Any]]] = None, enable_cross_partition_query: bool = True):
        class AsyncIterator:
            def __init__(self, results):
                self.results = results
                self.index = 0
            def __aiter__(self):
                return self
            async def __anext__(self):
                if self.index < len(self.results):
                    val = self.results[self.index]
                    self.index += 1
                    return val
                raise StopAsyncIteration

        results = list(self.items.values())
        
        # Apply filtering if parameters are provided
        if parameters:
            for param in parameters:
                name = param["name"].replace("@", "")
                val = param["value"]
                
                # Check query string for how this parameter is used
                if f"c.{name}" in query:
                    results = [r for r in results if r.get(name) == val]
                elif name == "storeId":
                    results = [r for r in results if r.get("storeId") == val]
                elif name == "email":
                    results = [r for r in results if r.get("email") == val]
                elif name == "uid":
                    results = [r for r in results if r.get("uid") == val]

        # Simple manual ordering parsing
        if "ORDER BY" in query:
            if "c.time DESC" in query:
                results.sort(key=lambda x: x.get("time") or "", reverse=True)
            elif "c.lastScanned DESC" in query:
                results.sort(key=lambda x: x.get("lastScanned") or "", reverse=True)
            elif "c.compliance" in query:
                results.sort(key=lambda x: x.get("compliance", 0))

        return AsyncIterator(results)


class DatabaseManager:
    def __init__(self):
        self.client: Optional[CosmosClient] = None
        self.database: Optional[Any] = None
        self.containers: Dict[str, Any] = {}
        self.use_mock: bool = settings.MOCK_DB

    async def connect(self):
        if self.use_mock:
            logger.info("Initializing in-memory Mock Database...")
            self._init_mock_db()
            return

        try:
            logger.info(f"Connecting to Azure Cosmos DB at {settings.COSMOS_ENDPOINT}...")
            self.client = CosmosClient(settings.COSMOS_ENDPOINT, credential=settings.COSMOS_KEY)
            
            # Create database if it doesn't exist
            logger.info(f"Creating database '{settings.COSMOS_DATABASE}' if it doesn't exist...")
            self.database = await self.client.create_database_if_not_exists(id=settings.COSMOS_DATABASE)
            logger.info(f"Database '{settings.COSMOS_DATABASE}' is ready.")
            
            container_definitions = [
                (settings.CONTAINER_STORES, "/id"),
                (settings.CONTAINER_TAGS, "/storeId"),
                (settings.CONTAINER_ROUNDS, "/storeId"),
                (settings.CONTAINER_ALERTS, "/storeId"),
                (settings.CONTAINER_USERS, "/email"),
            ]
            
            # Create all containers if they don't exist
            logger.info(f"Creating {len(container_definitions)} containers if they don't exist...")
            for c_name, p_key in container_definitions:
                try:
                    logger.info(f"Creating container '{c_name}' with partition key '{p_key}'...")
                    self.containers[c_name] = await self.database.create_container_if_not_exists(
                        id=c_name,
                        partition_key=PartitionKey(path=p_key)
                    )
                    logger.info(f"Container '{c_name}' is ready.")
                except Exception as container_error:
                    logger.error(f"Failed to create container '{c_name}': {container_error}")
                    raise
            
            logger.info("✓ Cosmos DB connection and all containers are ready!")
            
        except Exception as e:
            logger.error(f"Failed to connect to Azure Cosmos DB: {e}. Falling back to in-memory Mock Database.")
            self.use_mock = True
            self._init_mock_db()

    async def close(self):
        if self.client and not self.use_mock:
            await self.client.close()
            logger.info("Azure Cosmos DB connection closed.")

    def get_container(self, name: str) -> Any:
        return self.containers[name]

    def _init_mock_db(self):
        """Pre-populates the mock database containers with seed data matching the Figma mockData.ts."""
        self.containers[settings.CONTAINER_STORES] = MockContainer(settings.CONTAINER_STORES)
        self.containers[settings.CONTAINER_TAGS] = MockContainer(settings.CONTAINER_TAGS)
        self.containers[settings.CONTAINER_ROUNDS] = MockContainer(settings.CONTAINER_ROUNDS)
        self.containers[settings.CONTAINER_ALERTS] = MockContainer(settings.CONTAINER_ALERTS)
        self.containers[settings.CONTAINER_USERS] = MockContainer(settings.CONTAINER_USERS)
        
        # Seed Users
        users_container = self.containers[settings.CONTAINER_USERS]
        users_container.items = {
            "admin@cleancheck.com": {
                "id": "u1", "email": "admin@cleancheck.com", "password_hash": "$2b$12$zI76K63b/Qv213l.gN70EOmUq5sJkKx.9M200H0yqR/eIbe9D8sCq", # "password"
                "name": "Alex Mercer", "role": "admin", "storeId": "store-042"
            },
            "maria@cleancheck.com": {
                "id": "u2", "email": "maria@cleancheck.com", "password_hash": "$2b$12$zI76K63b/Qv213l.gN70EOmUq5sJkKx.9M200H0yqR/eIbe9D8sCq", # "password"
                "name": "Maria Santos", "role": "cleaner", "storeId": "store-042", "shift": "06:00 AM – 02:00 PM"
            },
            "priya@cleancheck.com": {
                "id": "u3", "email": "priya@cleancheck.com", "password_hash": "$2b$12$zI76K63b/Qv213l.gN70EOmUq5sJkKx.9M200H0yqR/eIbe9D8sCq", # "password"
                "name": "Priya Nair", "role": "cleaner", "storeId": "store-042", "shift": "08:00 AM – 04:00 PM"
            }
        }

        # Seed Stores
        stores_container = self.containers[settings.CONTAINER_STORES]
        stores_container.items = {
            "store-042": {
                "id": "store-042", "name": "FreshMart Superstore", "storeNumber": "#042",
                "location": "Level 1, East Wing Mall", "manager": "James Okafor", "compliance": 85,
                "nfcCount": 12, "activeAlerts": 5, "lastSync": "2 min ago",
                "complianceHistory": [
                    {"hour": "6AM", "done": 4, "missed": 1},
                    {"hour": "7AM", "done": 6, "missed": 2},
                    {"hour": "8AM", "done": 7, "missed": 1},
                    {"hour": "9AM", "done": 5, "missed": 0},
                    {"hour": "10AM", "done": 8, "missed": 2},
                    {"hour": "11AM", "done": 6, "missed": 1}
                ]
            },
            "store-018": {
                "id": "store-018", "name": "QuickShop Mall", "storeNumber": "#018",
                "location": "Level 2, North Plaza", "manager": "Sara Thompson", "compliance": 72,
                "nfcCount": 8, "activeAlerts": 5, "lastSync": "5 min ago",
                "complianceHistory": [
                    {"hour": "6AM", "done": 3, "missed": 2},
                    {"hour": "7AM", "done": 4, "missed": 3},
                    {"hour": "8AM", "done": 5, "missed": 2},
                    {"hour": "9AM", "done": 4, "missed": 3},
                    {"hour": "10AM", "done": 6, "missed": 2},
                    {"hour": "11AM", "done": 5, "missed": 3}
                ]
            },
            "store-031": {
                "id": "store-031", "name": "CityMart Express", "storeNumber": "#031",
                "location": "Ground Floor, Central Station", "manager": "Ana Rivera", "compliance": 91,
                "nfcCount": 6, "activeAlerts": 2, "lastSync": "1 min ago",
                "complianceHistory": [
                    {"hour": "6AM", "done": 5, "missed": 0},
                    {"hour": "7AM", "done": 6, "missed": 1},
                    {"hour": "8AM", "done": 6, "missed": 0},
                    {"hour": "9AM", "done": 5, "missed": 1},
                    {"hour": "10AM", "done": 6, "missed": 0},
                    {"hour": "11AM", "done": 6, "missed": 0}
                ]
            }
        }

        # Seed Tags
        tags_container = self.containers[settings.CONTAINER_TAGS]
        tags_container.items = {
            # store-042 tags
            "t1": {"id": "t1", "uid": "04:A3:7F", "location": "Produce Section", "area": "Aisle 1", "floor": "Floor A", "zone": "Retail", "priority": "high", "status": "active", "storeId": "store-042", "lastScanned": "09:37 AM"},
            "t2": {"id": "t2", "uid": "04:B2:3C", "location": "Bakery Section", "area": "Aisle 2", "floor": "Floor A", "zone": "Retail", "priority": "medium", "status": "active", "storeId": "store-042", "lastScanned": "09:15 AM"},
            "t3": {"id": "t3", "uid": "04:C4:5E", "location": "Dairy – Aisle 3", "area": "Aisle 3", "floor": "Floor A", "zone": "Retail", "priority": "high", "status": "active", "storeId": "store-042", "lastScanned": "09:00 AM"},
            "t4": {"id": "t4", "uid": "04:D5:6F", "location": "Meat & Seafood", "area": "Aisle 4", "floor": "Floor A", "zone": "Retail", "priority": "high", "status": "active", "storeId": "store-042", "lastScanned": "08:45 AM"},
            "t5": {"id": "t5", "uid": "04:E6:7G", "location": "Restrooms – Level 1", "area": "Side", "floor": "Floor A", "zone": "Facilities", "priority": "high", "status": "active", "storeId": "store-042", "lastScanned": "08:32 AM"},
            "t6": {"id": "t6", "uid": "04:F7:8H", "location": "Checkout Lanes 1–6", "area": "Front", "floor": "Floor A", "zone": "Retail", "priority": "medium", "status": "error", "storeId": "store-042", "lastScanned": "08:00 AM"},
            "t7": {"id": "t7", "uid": "04:G8:9I", "location": "Beverages – Aisle 7", "area": "Aisle 7", "floor": "Floor A", "zone": "Retail", "priority": "low", "status": "active", "storeId": "store-042", "lastScanned": "07:55 AM"},
            "t8": {"id": "t8", "uid": "04:H9:0J", "location": "Frozen Foods", "area": "Aisle 8", "floor": "Floor A", "zone": "Storage", "priority": "medium", "status": "active", "storeId": "store-042", "lastScanned": "07:30 AM"},
            "t9": {"id": "t9", "uid": "04:I0:1K", "location": "Staff Break Room", "area": "Back Area", "floor": "Floor B", "zone": "Facilities", "priority": "low", "status": "active", "storeId": "store-042", "registeredAt": "Jun 10, 2026"},
            "t10": {"id": "t10", "uid": "04:J1:2L", "location": "Loading Dock", "area": "Back Area", "floor": "Floor B", "zone": "Storage", "priority": "medium", "status": "active", "storeId": "store-042", "registeredAt": "Jun 10, 2026"},
            "t11": {"id": "t11", "uid": "04:K2:3M", "location": "Manager's Office", "area": "Back Area", "floor": "Floor B", "zone": "Office", "priority": "low", "status": "active", "storeId": "store-042", "registeredAt": "Jun 10, 2026"},
            "t12": {"id": "t12", "uid": "04:L3:4N", "location": "Deli Counter", "area": "Aisle 2", "floor": "Floor A", "zone": "Retail", "priority": "high", "status": "active", "storeId": "store-042", "lastScanned": "09:20 AM"},
            
            # store-018 tags
            "t13": {"id": "t13", "uid": "05:A1:2B", "location": "Entrance Hall", "area": "Main", "floor": "Floor 2", "zone": "Retail", "priority": "high", "status": "active", "storeId": "store-018", "lastScanned": "09:10 AM"},
            "t14": {"id": "t14", "uid": "05:B2:3C", "location": "Electronics Section", "area": "Aisle A", "floor": "Floor 2", "zone": "Retail", "priority": "high", "status": "active", "storeId": "store-018", "lastScanned": "08:50 AM"}
        }

        # Seed Rounds
        rounds_container = self.containers[settings.CONTAINER_ROUNDS]
        rounds_container.items = {
            "r1": {
                "id": "r1", "storeId": "store-042", "name": "Morning Round #3", "time": "09:37 AM", "staff": "Maria Santos",
                "compliance": 75, "totalScans": 12, "completedScans": 9,
                "scans": [
                    {"id": "s1", "location": "Produce Section", "time": "08:00 AM", "status": "verified", "nfcUid": "04:A3:7F", "staff": "Maria Santos", "compliance": 100},
                    {"id": "s2", "location": "Bakery Section", "time": "08:10 AM", "status": "verified", "nfcUid": "04:B2:3C", "staff": "Maria Santos", "compliance": 100},
                    {"id": "s3", "location": "Dairy – Aisle 3", "time": "08:20 AM", "status": "verified", "nfcUid": "04:C4:5E", "staff": "Maria Santos", "compliance": 100},
                    {"id": "s4", "location": "Meat & Seafood", "time": "08:30 AM", "status": "verified", "nfcUid": "04:D5:6F", "staff": "Maria Santos", "compliance": 100},
                    {"id": "s5", "location": "Restrooms – Level 1", "time": "08:40 AM", "status": "verified", "nfcUid": "04:E6:7G", "staff": "Maria Santos", "compliance": 100},
                    {"id": "s6", "location": "Checkout Lanes 1–6", "time": "08:50 AM", "status": "missed", "nfcUid": "04:F7:8H", "staff": "Maria Santos", "compliance": 0},
                    {"id": "s7", "location": "Beverages – Aisle 7", "time": "09:00 AM", "status": "verified", "nfcUid": "04:G8:9I", "staff": "Maria Santos", "compliance": 100},
                    {"id": "s8", "location": "Frozen Foods", "time": "09:10 AM", "status": "verified", "nfcUid": "04:H9:0J", "staff": "Maria Santos", "compliance": 100},
                    {"id": "s9", "location": "Deli Counter", "time": "09:20 AM", "status": "verified", "nfcUid": "04:L3:4N", "staff": "Maria Santos", "compliance": 100}
                ]
            }
        }

        # Seed Alerts
        alerts_container = self.containers[settings.CONTAINER_ALERTS]
        alerts_container.items = {
            "a1": {
                "id": "a1", "storeId": "store-042", "type": "critical", "category": "missing-round",
                "title": "Missing Round – Beverages Aisle 7",
                "description": "Morning Round #1 completed at 07:00 AM. No new round started after 75 min — exceeds 60-min threshold. Beverages Aisle 7 unattended.",
                "time": "08:15 AM", "location": "Beverages Aisle 7", "status": "active"
            },
            "a2": {
                "id": "a2", "storeId": "store-042", "type": "critical", "category": "low-compliance",
                "title": "Low Compliance – Morning Round #2",
                "description": "Round completed with 58% compliance (7/12 checkpoints scanned). Below 75% threshold. Staff: Priya Nair.",
                "time": "07:15 AM", "staff": "Priya Nair", "status": "active"
            },
            "a3": {
                "id": "a3", "storeId": "store-042", "type": "fraud", "category": "gps-mismatch",
                "title": "GPS Mismatch – Checkout Lane 3",
                "description": "Scan recorded but GPS is 45 m from the registered tag location. Possible fraudulent check-in.",
                "time": "08:12 AM", "location": "Checkout Lanes 1–6", "status": "active"
            }
        }

db_manager = DatabaseManager()
