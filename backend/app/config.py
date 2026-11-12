from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://jsport:jsport@localhost:5432/jsport"
    jwt_secret: str = "dev-only-secret-change-me-in-production-0000"
    jwt_ttl_minutes: int = 60 * 24 * 30

    # Court check-in rules (from the spec)
    session_minutes: int = 90
    extend_minutes: int = 45
    warn_before_minutes: int = 15
    max_extensions: int = 1

    # Users "near the court" shown on the court screen
    nearby_players_radius_m: int = 2000

    media_dir: str = "media"
    public_base_url: str = "http://localhost:8000"

    scheduler_enabled: bool = True
    scheduler_interval_s: int = 30
    expo_push_url: str = "https://exp.host/--/api/v2/push/send"


@lru_cache
def get_settings() -> Settings:
    return Settings()
