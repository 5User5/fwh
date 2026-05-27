from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.schemas.conversation import ConversationCreate, ConversationUpdate
from app.schemas.message import MessageCreate
from app.services.user_service import UserService
from app.services.message_service import MessageService
from app.core.config import settings


class ConversationService:
    @staticmethod
    def get_conversation(db: Session, conversation_id: int) -> Optional[Conversation]:
        return db.query(Conversation).filter(Conversation.id == conversation_id).first()

    @staticmethod
    def get_conversations_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Conversation]:
        return db.query(Conversation).filter(Conversation.user_id == user_id).offset(skip).limit(limit).all()

    @staticmethod
    def create_conversation(db: Session, conversation: ConversationCreate) -> Conversation:
        db_conversation = Conversation(
            user_id=conversation.user_id,
            title=conversation.title
        )
        db.add(db_conversation)
        db.commit()
        db.refresh(db_conversation)
        return db_conversation

    @staticmethod
    def update_conversation(db: Session, conversation_id: int, conversation: ConversationUpdate) -> Optional[Conversation]:
        db_conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if db_conversation:
            update_data = conversation.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_conversation, field, value)
            db.commit()
            db.refresh(db_conversation)
        return db_conversation

    @staticmethod
    def delete_conversation(db: Session, conversation_id: int) -> bool:
        db_conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if db_conversation:
            db.delete(db_conversation)
            db.commit()
            return True
        return False


class ConversationManager:
    @staticmethod
    def _estimate_tokens(text: str) -> int:
        return len(text) // 2

    @staticmethod
    def get_or_create_conversation(db: Session, openid: str, nickname: Optional[str] = None) -> Conversation:
        user = UserService.get_user_by_openid(db, openid)
        if not user:
            from app.schemas.user import UserCreate
            user = UserService.create_user(db, UserCreate(openid=openid, nickname=nickname or ""))
        
        conversations = ConversationService.get_conversations_by_user(db, user.id, limit=1)
        if conversations:
            return conversations[0]
        
        conversation_create = ConversationCreate(user_id=user.id, title="新对话")
        return ConversationService.create_conversation(db, conversation_create)

    @staticmethod
    def add_message(db: Session, conversation_id: int, role: str, content: str) -> Message:
        message_create = MessageCreate(
            conversation_id=conversation_id,
            role=role,
            content=content
        )
        return MessageService.create_message(db, message_create)

    @staticmethod
    def get_conversation_history(db: Session, conversation_id: int) -> List[Message]:
        return MessageService.get_messages_by_conversation(db, conversation_id)

    @staticmethod
    def build_context_messages(db: Session, conversation_id: int, system_prompt: Optional[str] = None) -> List[Dict[str, str]]:
        messages = ConversationManager.get_conversation_history(db, conversation_id)
        context = []
        
        prompt_to_use = system_prompt or settings.SYSTEM_PROMPT
        if prompt_to_use:
            context.append({"role": "system", "content": prompt_to_use})
        
        total_tokens = ConversationManager._estimate_tokens(prompt_to_use) if prompt_to_use else 0
        
        for msg in reversed(messages):
            msg_tokens = ConversationManager._estimate_tokens(msg.content)
            if total_tokens + msg_tokens <= settings.MAX_TOKENS and len(context) < settings.MAX_CONTEXT_LENGTH:
                context.insert(1, {"role": msg.role, "content": msg.content})
                total_tokens += msg_tokens
            else:
                break
        
        return context

    @staticmethod
    def clear_conversation(db: Session, conversation_id: int) -> bool:
        messages = MessageService.get_messages_by_conversation(db, conversation_id)
        for msg in messages:
            MessageService.delete_message(db, msg.id)
        return True
