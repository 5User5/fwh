
import time
import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.services.conversation_service import ConversationManager
from app.services.model_service import ModelService
from app.services.domain_service import DomainService
from app.services.image_service import ImageService
from app.core.config import settings

logger = logging.getLogger(__name__)


class ChatService:
    def __init__(self):
        self.model_service = ModelService()
        self.timeout = settings.MODEL_TIMEOUT
        self.domain_service = DomainService()
        self.image_service = ImageService()

    def process_message(
        self,
        db: Session,
        openid: str,
        user_message: str,
        nickname: Optional[str] = None
    ) -&gt; str:
        try:
            if self._is_clear_command(user_message):
                return self._handle_clear_command(db, openid, nickname)

            if self.image_service.is_image_request(user_message):
                return self._handle_image_request(db, openid, user_message, nickname)

            conversation = ConversationManager.get_or_create_conversation(db, openid, nickname)

            ConversationManager.add_message(db, conversation.id, "user", user_message)

            system_prompt = None
            if settings.ENABLE_DOMAIN_DETECTION:
                domain = self.domain_service.identify_domain(user_message)
                logger.info(f"Identified domain: {domain}")
                system_prompt = self.domain_service.get_system_prompt(domain)
            else:
                system_prompt = self.domain_service.get_system_prompt(settings.DEFAULT_DOMAIN)

            context_messages = ConversationManager.build_context_messages(db, conversation.id, system_prompt)

            start_time = time.time()
            try:
                response = self.model_service.chat(context_messages, timeout=self.timeout)
            except Exception as e:
                logger.error(f"Model call failed: {str(e)}")
                return "抱歉，我暂时无法回答您的问题，请稍后再试。"

            elapsed_time = time.time() - start_time
            logger.info(f"Model call took {elapsed_time:.2f} seconds")

            if not response or "choices" not in response or len(response["choices"]) == 0:
                logger.error(f"Invalid model response: {response}")
                return "抱歉，我暂时无法回答您的问题。"

            assistant_content = response["choices"][0]["message"]["content"]

            ConversationManager.add_message(db, conversation.id, "assistant", assistant_content)

            return assistant_content

        except Exception as e:
            logger.error(f"Error processing message: {str(e)}", exc_info=True)
            return "抱歉，发生了一些错误，请稍后再试。"

    def _is_clear_command(self, message: str) -> bool:
        message = message.strip().lower()
        return message in ["清空对话", "/clear", "clear"]

    def _handle_clear_command(
        self,
        db: Session,
        openid: str,
        nickname: Optional[str] = None
    ) -&gt; str:
        try:
            conversation = ConversationManager.get_or_create_conversation(db, openid, nickname)
            ConversationManager.clear_conversation(db, conversation.id)
            return "对话已清空，我们可以重新开始了！"
        except Exception as e:
            logger.error(f"Error clearing conversation: {str(e)}", exc_info=True)
            return "抱歉，清空对话失败，请稍后再试。"

    def _handle_image_request(
        self,
        db: Session,
        openid: str,
        user_message: str,
        nickname: Optional[str] = None
    ) -&gt; str:
        try:
            conversation = ConversationManager.get_or_create_conversation(db, openid, nickname)
            ConversationManager.add_message(db, conversation.id, "user", user_message)

            image_url = self.image_service.generate_image(user_message)
            
            if image_url:
                response_content = f"好的，我为您生成了一张图片！\n\n{image_url}"
                ConversationManager.add_message(db, conversation.id, "assistant", response_content)
                return response_content
            else:
                error_msg = "抱歉，图片生成失败，请稍后再试。"
                ConversationManager.add_message(db, conversation.id, "assistant", error_msg)
                return error_msg
        except Exception as e:
            logger.error(f"Error handling image request: {str(e)}", exc_info=True)
            return "抱歉，图片生成失败，请稍后再试。"

