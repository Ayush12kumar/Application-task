from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-First CRM HCP Module"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/crm_hcp_db"
    
    # Groq AI
    GROQ_API_KEY: str = "gsk_placeholder"
    GROQ_PRIMARY_MODEL: str = "gemma2-9b-it"
    GROQ_SECONDARY_MODEL: str = "llama-3.3-70b-versatile"
    
    # Security & CORS
    SECRET_KEY: str = "crm_enterprise_secret_key_change_in_production"
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
