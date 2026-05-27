import time
import logging
import requests
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class ModelService:
    def __init__(self):
        self.api_url = settings.MODEL_API_URL
        self.api_key = settings.MODEL_API_KEY
        self.timeout = settings.MODEL_TIMEOUT
        self.max_retries = settings.MODEL_MAX_RETRIES
        self.retry_delay = settings.MODEL_RETRY_DELAY
        self.use_mock = settings.MODEL_USE_MOCK

    def _get_mock_response(self, messages: List[Dict[str, str]]) -> Dict[str, Any]:
        user_message = messages[-1].get("content", "") if messages else ""
        return {
            "choices": [
                {
                    "message": {
                        "role": "assistant",
                        "content": "这是模拟的模型响应。您发送了: " + user_message
                    }
                }
            ],
            "usage": {
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0
            },
            "model": "solo-auto-model-mock"
        }

    def _send_request(self, messages: List[Dict[str, str]], **kwargs) -> Dict[str, Any]:
        headers = {
            "Content-Type": "application/json"
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        payload = {
            "messages": messages,
            **kwargs
        }
        
        logger.debug(f"Sending request to model API: {self.api_url}")
        
        response = requests.post(
            self.api_url,
            headers=headers,
            json=payload,
            timeout=self.timeout
        )
        response.raise_for_status()
        return response.json()

    def chat(self, messages: List[Dict[str, str]], **kwargs) -> Optional[Dict[str, Any]]:
        if self.use_mock:
            logger.debug("Using mock model response")
            return self._get_mock_response(messages)
        
        last_exception = None
        for attempt in range(self.max_retries):
            try:
                logger.debug(f"Model API attempt {attempt + 1}/{self.max_retries}")
                return self._send_request(messages, **kwargs)
            except requests.exceptions.RequestException as e:
                last_exception = e
                if attempt == self.max_retries - 1:
                    logger.error(f"Model API request failed after {self.max_retries} attempts: {str(e)}")
                    raise
                wait_time = self.retry_delay * (attempt + 1)
                logger.warning(f"Model API request failed, retrying in {wait_time}s: {str(e)}")
                time.sleep(wait_time)
        
        return None

    def simple_chat(self, user_message: str, system_prompt: Optional[str] = None) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": user_message})
        
        try:
            response = self.chat(messages)
            if response and "choices" in response and len(response["choices"]) > 0:
                return response["choices"][0]["message"]["content"]
            return "抱歉，我暂时无法回答您的问题。"
        except Exception as e:
            logger.error(f"Error in simple_chat: {str(e)}", exc_info=True)
            return "抱歉，我暂时无法回答您的问题，请稍后再试。"
