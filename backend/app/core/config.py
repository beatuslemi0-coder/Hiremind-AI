
from functools import lru_cache
from typing import List
from google.genai import types
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    GEMINI_API_KEY:str
    AI_MODEL:str
    
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM_MAIL: str | None = None
    SMTP_USE_TLS: str | None = None
    
    
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
        )

settings = Settings()

