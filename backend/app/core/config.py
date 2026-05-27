from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    WECHAT_TOKEN: str = ""
    WECHAT_APPID: str = ""
    WECHAT_SECRET: str = ""
    WECHAT_ENCODING_AES_KEY: str = ""
    DATABASE_URL: str = "sqlite:///./solo_auto_model.db"
    MODEL_API_URL: str = "http://localhost:8000/v1/chat/completions"
    MODEL_API_KEY: str = ""
    MODEL_TIMEOUT: int = 30
    MODEL_MAX_RETRIES: int = 3
    MODEL_RETRY_DELAY: float = 1.0
    MODEL_USE_MOCK: bool = True
    MAX_CONTEXT_LENGTH: int = 20
    MAX_TOKENS: int = 4000
    SYSTEM_PROMPT: str = "你是一个乐于助人的AI助手。"
    ENABLE_DOMAIN_DETECTION: bool = True
    DEFAULT_DOMAIN: str = "general"
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123"
    ADMIN_SECRET_KEY: str = "your-secret-key-change-in-production"
    ENABLE_IMAGE_GENERATION: bool = False
    IMAGE_API_URL: str = ""
    IMAGE_API_KEY: str = ""
    IMAGE_USE_MOCK: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
