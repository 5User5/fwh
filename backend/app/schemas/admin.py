from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class AdminLoginRequest(BaseModel):
    username: str
    password: str


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AdminMessage(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class AdminConversationDetail(BaseModel):
    id: int
    user_id: int
    user_openid: str
    user_nickname: Optional[str] = None
    title: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    messages: List[AdminMessage] = []

    class Config:
        from_attributes = True


class AdminConversation(BaseModel):
    id: int
    user_id: int
    user_openid: str
    user_nickname: Optional[str] = None
    title: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    message_count: int = 0

    class Config:
        from_attributes = True


class AdminUser(BaseModel):
    id: int
    openid: str
    nickname: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    conversation_count: int = 0

    class Config:
        from_attributes = True


class SystemStats(BaseModel):
    total_users: int
    total_conversations: int
    total_messages: int
    active_users_today: int


class SystemConfig(BaseModel):
    WECHAT_TOKEN: Optional[str] = None
    WECHAT_APPID: Optional[str] = None
    WECHAT_SECRET: Optional[str] = None
    WECHAT_ENCODING_AES_KEY: Optional[str] = None
    MODEL_API_URL: Optional[str] = None
    MODEL_TIMEOUT: Optional[int] = None
    MODEL_MAX_RETRIES: Optional[int] = None
    MODEL_RETRY_DELAY: Optional[float] = None
    MODEL_USE_MOCK: Optional[bool] = None
    MAX_CONTEXT_LENGTH: Optional[int] = None
    MAX_TOKENS: Optional[int] = None
    SYSTEM_PROMPT: Optional[str] = None
    ENABLE_DOMAIN_DETECTION: Optional[bool] = None
    DEFAULT_DOMAIN: Optional[str] = None


class ConfigUpdateRequest(BaseModel):
    WECHAT_TOKEN: Optional[str] = None
    WECHAT_APPID: Optional[str] = None
    WECHAT_SECRET: Optional[str] = None
    WECHAT_ENCODING_AES_KEY: Optional[str] = None
    MODEL_API_URL: Optional[str] = None
    MODEL_API_KEY: Optional[str] = None
    MODEL_TIMEOUT: Optional[int] = None
    MODEL_MAX_RETRIES: Optional[int] = None
    MODEL_RETRY_DELAY: Optional[float] = None
    MODEL_USE_MOCK: Optional[bool] = None
    MAX_CONTEXT_LENGTH: Optional[int] = None
    MAX_TOKENS: Optional[int] = None
    SYSTEM_PROMPT: Optional[str] = None
    ENABLE_DOMAIN_DETECTION: Optional[bool] = None
    DEFAULT_DOMAIN: Optional[str] = None
