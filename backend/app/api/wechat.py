import hashlib
import logging
import xml.etree.ElementTree as ET
from datetime import datetime
from fastapi import APIRouter, Request, Response, Depends
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.services.chat_service import ChatService

logger = logging.getLogger(__name__)
router = APIRouter()
chat_service = ChatService()


def check_signature(signature: str, timestamp: str, nonce: str) -> bool:
    token = settings.WECHAT_TOKEN
    params = [token, timestamp, nonce]
    params.sort()
    temp_str = "".join(params)
    temp_str = hashlib.sha1(temp_str.encode()).hexdigest()
    return temp_str == signature


def parse_message(xml_data: str) -> dict:
    root = ET.fromstring(xml_data)
    msg = {}
    for child in root:
        msg[child.tag] = child.text
    return msg


def create_text_reply(to_user: str, from_user: str, content: str) -> str:
    reply = f"""<xml>
<ToUserName><![CDATA[{to_user}]]></ToUserName>
<FromUserName><![CDATA[{from_user}]]></FromUserName>
<CreateTime>{int(datetime.now().timestamp())}</CreateTime>
<MsgType><![CDATA[text]]></MsgType>
<Content><![CDATA[{content}]]></Content>
</xml>"""
    return reply


@router.get("")
async def wechat_verify(signature: str, timestamp: str, nonce: str, echostr: str):
    logger.info(f"WeChat verification request: signature={signature}, timestamp={timestamp}")
    if check_signature(signature, timestamp, nonce):
        logger.info("WeChat verification successful")
        return Response(content=echostr, media_type="text/plain")
    logger.warning("WeChat verification failed: invalid signature")
    return Response(content="Invalid signature", media_type="text/plain")


@router.post("")
async def wechat_message(request: Request, db: Session = Depends(get_db)):
    try:
        xml_data = await request.body()
        msg = parse_message(xml_data.decode())
        
        msg_type = msg.get("MsgType")
        to_user = msg.get("FromUserName")
        from_user = msg.get("ToUserName")
        
        logger.info(f"Received WeChat message: type={msg_type}, from={to_user}")
        
        if msg_type == "text":
            content = msg.get("Content", "")
            logger.info(f"Processing text message: {content[:50]}...")
            reply_content = chat_service.process_message(db, to_user, content)
            reply_xml = create_text_reply(to_user, from_user, reply_content)
            return Response(content=reply_xml, media_type="application/xml")
        
        reply_content = "暂不支持此类消息"
        reply_xml = create_text_reply(to_user, from_user, reply_content)
        return Response(content=reply_xml, media_type="application/xml")
    except Exception as e:
        logger.error(f"Error processing WeChat message: {str(e)}", exc_info=True)
        error_reply = create_text_reply(
            msg.get("FromUserName", "") if 'msg' in locals() else "", 
            msg.get("ToUserName", "") if 'msg' in locals() else "", 
            "抱歉，处理消息时发生错误，请稍后再试。"
        )
        return Response(content=error_reply, media_type="application/xml")
