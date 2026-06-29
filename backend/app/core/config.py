from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./smart_cube_hub.db"
    secret_key: str = "change-me-in-production"
    debug: bool = True
    access_token_expire_minutes: int = 60 * 24 * 7

    class Config:
        env_file = ".env"


settings = Settings()
