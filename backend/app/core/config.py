
from functools import lru_cache
from typing import List
from google.genai import types
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
        )

# AI API key na model vinatoka kwenye environment variables.
    GEMINI_API_KEY: str

# Jina la AI model tunayotumia.
    AI_MODEL: str

settings = Settings()

