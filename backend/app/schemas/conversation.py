from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class ConversationBase(BaseModel):
    user_id: int
    title: str


class ConversationCreate(BaseModel):
    user_id: int
    title: str


class ConversationUpdate(BaseModel):
    title: Optional[str] = None


class ConversationInDBBase(ConversationBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Conversation(ConversationInDBBase):
    pass


class ConversationInDB(ConversationInDBBase):
    pass
