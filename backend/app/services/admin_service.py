from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.core.config import settings


class AdminService:
    @staticmethod
    def verify_admin(username: str, password: str) -&gt; bool:
        return username == settings.ADMIN_USERNAME and password == settings.ADMIN_PASSWORD

    @staticmethod
    def create_access_token(username: str) -&gt; str:
        import jwt
        payload = {
            "sub": username,
            "exp": datetime.utcnow() + timedelta(hours=24)
        }
        return jwt.encode(payload, settings.ADMIN_SECRET_KEY, algorithm="HS256")

    @staticmethod
    def verify_token(token: str) -&gt; Optional[str]:
        try:
            import jwt
            payload = jwt.decode(token, settings.ADMIN_SECRET_KEY, algorithms=["HS256"])
            username: str = payload.get("sub")
            if username == settings.ADMIN_USERNAME:
                return username
            return None
        except Exception:
            return None

    @staticmethod
    def get_all_users(db: Session, skip: int = 0, limit: int = 100) -&gt; List[User]:
        return db.query(User).offset(skip).limit(limit).all()

    @staticmethod
    def get_all_conversations(db: Session, skip: int = 0, limit: int = 100) -&gt; List[Conversation]:
        return db.query(Conversation).order_by(Conversation.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_conversation_by_id(db: Session, conversation_id: int) -&gt; Optional[Conversation]:
        return db.query(Conversation).filter(Conversation.id == conversation_id).first()

    @staticmethod
    def delete_conversation(db: Session, conversation_id: int) -&gt; bool:
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if conversation:
            db.delete(conversation)
            db.commit()
            return True
        return False

    @staticmethod
    def get_system_stats(db: Session) -&gt; Dict[str, Any]:
        total_users = db.query(func.count(User.id)).scalar() or 0
        total_conversations = db.query(func.count(Conversation.id)).scalar() or 0
        total_messages = db.query(func.count(Message.id)).scalar() or 0
        
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        active_users_today = db.query(func.count(func.distinct(Conversation.user_id)))\
            .filter(Conversation.created_at &gt;= today_start)\
            .scalar() or 0
        
        return {
            "total_users": total_users,
            "total_conversations": total_conversations,
            "total_messages": total_messages,
            "active_users_today": active_users_today
        }

    @staticmethod
    def get_system_config() -&gt; Dict[str, Any]:
        return {
            "WECHAT_TOKEN": settings.WECHAT_TOKEN,
            "WECHAT_APPID": settings.WECHAT_APPID,
            "WECHAT_SECRET": settings.WECHAT_SECRET,
            "WECHAT_ENCODING_AES_KEY": settings.WECHAT_ENCODING_AES_KEY,
            "MODEL_API_URL": settings.MODEL_API_URL,
            "MODEL_TIMEOUT": settings.MODEL_TIMEOUT,
            "MODEL_MAX_RETRIES": settings.MODEL_MAX_RETRIES,
            "MODEL_RETRY_DELAY": settings.MODEL_RETRY_DELAY,
            "MODEL_USE_MOCK": settings.MODEL_USE_MOCK,
            "MAX_CONTEXT_LENGTH": settings.MAX_CONTEXT_LENGTH,
            "MAX_TOKENS": settings.MAX_TOKENS,
            "SYSTEM_PROMPT": settings.SYSTEM_PROMPT,
            "ENABLE_DOMAIN_DETECTION": settings.ENABLE_DOMAIN_DETECTION,
            "DEFAULT_DOMAIN": settings.DEFAULT_DOMAIN
        }

    @staticmethod
    def update_system_config(config_data: Dict[str, Any]) -&gt; Dict[str, Any]:
        import os
        from dotenv import load_dotenv, set_key
        
        env_file = ".env"
        load_dotenv(env_file)
        
        updated_config = {}
        for key, value in config_data.items():
            if value is not None:
                set_key(env_file, key, str(value))
                if hasattr(settings, key):
                    setattr(settings, key, value)
                updated_config[key] = value
        
        return updated_config

    @staticmethod
    def get_conversation_message_count(db: Session, conversation_id: int) -&gt; int:
        return db.query(func.count(Message.id)).filter(Message.conversation_id == conversation_id).scalar() or 0

    @staticmethod
    def get_user_conversation_count(db: Session, user_id: int) -&gt; int:
        return db.query(func.count(Conversation.id)).filter(Conversation.user_id == user_id).scalar() or 0
