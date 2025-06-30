
# linkedin_sourcing_pipeline/config.py

from pydantic import BaseSettings, Field
from typing import Optional

class Settings(BaseSettings):
    # --- Core API Config ---
    coresignal_api_key: str = Field(..., env="CORESIGNAL_API_KEY")
    coresignal_base_url: str = Field("https://api.coresignal.com", env="CORESIGNAL_BASE_URL")
    use_mock_data: bool = Field(False, env="CORESIGNAL_USE_MOCK")

    # --- Redis / Caching ---
    redis_url: Optional[str] = Field(None, env="REDIS_URL")
    enable_cache: bool = Field(False, env="ENABLE_CACHE")

    # --- API Timeouts / Limits ---
    request_timeout: int = Field(30, env="REQUEST_TIMEOUT")
    max_retries: int = Field(3, env="MAX_RETRIES")
    rate_limit_delay: float = Field(1.0, env="RATE_LIMIT_DELAY")

    # --- Feature Toggles ---
    enable_enrichment: bool = Field(True, env="ENABLE_ENRICHMENT")
    enable_scoring: bool = Field(True, env="ENABLE_SCORING")
    enable_messaging: bool = Field(True, env="ENABLE_MESSAGING")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

# Singleton pattern to reuse
settings = Settings()
