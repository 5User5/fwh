from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.services.admin_service import AdminService
from app.schemas.admin import (
    AdminLoginRequest,
    AdminLoginResponse,
    AdminConversation,
    AdminConversationDetail,
    AdminUser,
    SystemStats,
    SystemConfig,
    ConfigUpdateRequest
)
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message

router = APIRouter(prefix="/admin", tags=["admin"])


async def get_current_admin(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未提供认证令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的认证方案",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证头格式",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    username = AdminService.verify_token(token)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的或已过期的令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return username


@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(request: AdminLoginRequest):
    if not AdminService.verify_admin(request.username, request.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )
    access_token = AdminService.create_access_token(request.username)
    return AdminLoginResponse(access_token=access_token)


@router.get("/conversations", response_model=List[AdminConversation])
async def get_conversations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin)
):
    conversations = AdminService.get_all_conversations(db, skip=skip, limit=limit)
    result = []
    for conv in conversations:
        user = db.query(User).filter(User.id == conv.user_id).first()
        message_count = AdminService.get_conversation_message_count(db, conv.id)
        result.append(AdminConversation(
            id=conv.id,
            user_id=conv.user_id,
            user_openid=user.openid if user else "",
            user_nickname=user.nickname if user else None,
            title=conv.title,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            message_count=message_count
        ))
    return result


@router.get("/conversations/{conversation_id}", response_model=AdminConversationDetail)
async def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin)
):
    conversation = AdminService.get_conversation_by_id(db, conversation_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="对话不存在"
        )
    user = db.query(User).filter(User.id == conversation.user_id).first()
    messages = db.query(Message).filter(Message.conversation_id == conversation_id).all()
    
    return AdminConversationDetail(
        id=conversation.id,
        user_id=conversation.user_id,
        user_openid=user.openid if user else "",
        user_nickname=user.nickname if user else None,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=messages
    )


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin)
):
    success = AdminService.delete_conversation(db, conversation_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="对话不存在"
        )
    return {"message": "对话删除成功"}


@router.get("/users", response_model=List[AdminUser])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin)
):
    users = AdminService.get_all_users(db, skip=skip, limit=limit)
    result = []
    for user in users:
        conv_count = AdminService.get_user_conversation_count(db, user.id)
        result.append(AdminUser(
            id=user.id,
            openid=user.openid,
            nickname=user.nickname,
            created_at=user.created_at,
            updated_at=user.updated_at,
            conversation_count=conv_count
        ))
    return result


@router.get("/stats", response_model=SystemStats)
async def get_stats(
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin)
):
    stats = AdminService.get_system_stats(db)
    return SystemStats(**stats)


@router.get("/config", response_model=SystemConfig)
async def get_config(
    _: str = Depends(get_current_admin)
):
    config = AdminService.get_system_config()
    return SystemConfig(**config)


@router.put("/config", response_model=SystemConfig)
async def update_config(
    config_update: ConfigUpdateRequest,
    _: str = Depends(get_current_admin)
):
    updated_config = AdminService.update_system_config(config_update.model_dump(exclude_unset=True))
    return SystemConfig(**updated_config)
