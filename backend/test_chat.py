
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy.orm import Session
from app.core.database import engine, SessionLocal, Base
from app.services.chat_service import ChatService
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message


def init_db():
    Base.metadata.create_all(bind=engine)


def test_chat_service():
    init_db()
    
    db = SessionLocal()
    try:
        chat_service = ChatService()
        
        print("测试普通消息处理...")
        response = chat_service.process_message(db, "test_openid_123", "你好！")
        print(f"回复: {response}\n")
        
        print("测试多轮对话...")
        response = chat_service.process_message(db, "test_openid_123", "我的名字叫什么？")
        print(f"回复: {response}\n")
        
        print("测试清空对话指令...")
        response = chat_service.process_message(db, "test_openid_123", "清空对话")
        print(f"回复: {response}\n")
        
        print("测试清空后的对话...")
        response = chat_service.process_message(db, "test_openid_123", "重新开始")
        print(f"回复: {response}\n")
        
        print("所有测试完成！")
        
    finally:
        db.close()


if __name__ == "__main__":
    test_chat_service()
