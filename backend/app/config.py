import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    COSMOS_ENDPOINT: str = "https://mock-retail-cosmos.documents.azure.com:443/"
    COSMOS_KEY: str = "MockKey1234567890abcdefghijklmnopqrstuvwxyz=="
    COSMOS_DATABASE: str = "retail_nfc_db"
    
    # Containers
    CONTAINER_STORES: str = "stores"
    CONTAINER_TAGS: str = "tags"
    CONTAINER_ROUNDS: str = "rounds"
    CONTAINER_ALERTS: str = "alerts"
    CONTAINER_USERS: str = "users"
    
    # Security
    JWT_SECRET: str = "retail_secret_key_antigravity"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    
    # Development / Mock Mode
    # If set to True, the app will run with in-memory mock databases when Cosmos DB credentials are invalid or default.
    MOCK_DB: bool = True

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
