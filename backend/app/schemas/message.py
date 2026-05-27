from datetime import datetime
from pydantic import BaseModel


class MessageBase(BaseModel):
    conversation_id: int
    role: str
    content: str


class MessageCreate(MessageBase):
    pass


class MessageInDBBase(MessageBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class Message(MessageInDBBase):
    pass


class MessageInDB(MessageInDBBase):
    pass
