from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.message import Message
from app.schemas.message import MessageCreate


class MessageService:
    @staticmethod
    def get_message(db: Session, message_id: int) -> Optional[Message]:
        return db.query(Message).filter(Message.id == message_id).first()

    @staticmethod
    def get_messages_by_conversation(db: Session, conversation_id: int, skip: int = 0, limit: int = 100) -> List[Message]:
        return db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at).offset(skip).limit(limit).all()

    @staticmethod
    def create_message(db: Session, message: MessageCreate) -> Message:
        db_message = Message(
            conversation_id=message.conversation_id,
            role=message.role,
            content=message.content
        )
        db.add(db_message)
        db.commit()
        db.refresh(db_message)
        return db_message

    @staticmethod
    def delete_message(db: Session, message_id: int) -> bool:
        db_message = db.query(Message).filter(Message.id == message_id).first()
        if db_message:
            db.delete(db_message)
            db.commit()
            return True
        return False
