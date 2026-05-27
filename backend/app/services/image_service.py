
import os
import uuid
import logging
import requests
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class ImageService:
    def __init__(self):
        self.image_keywords = [
            "画", "生成图片", "创建图片", "图片生成", "生成", "制作图片",
            "draw", "generate image", "create image", "image generation"
        ]
        self.images_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static", "images")
        self._ensure_images_dir()

    def _ensure_images_dir(self):
        os.makedirs(self.images_dir, exist_ok=True)

    def is_image_request(self, message: str) -&gt; bool:
        message_lower = message.lower()
        for keyword in self.image_keywords:
            if keyword in message_lower:
                return True
        return False

    def generate_image(self, prompt: str) -&gt; Optional[str]:
        try:
            if settings.IMAGE_USE_MOCK or not settings.ENABLE_IMAGE_GENERATION:
                return self._generate_mock_image(prompt)
            
            return self._call_image_api(prompt)
        except Exception as e:
            logger.error(f"Error generating image: {str(e)}", exc_info=True)
            return None

    def _generate_mock_image(self, prompt: str) -&gt; str:
        image_id = str(uuid.uuid4())
        image_filename = f"{image_id}.png"
        image_path = os.path.join(self.images_dir, image_filename)
        
        try:
            from PIL import Image, ImageDraw, ImageFont
            img = Image.new('RGB', (512, 512), color='lightblue')
            draw = ImageDraw.Draw(img)
            
            try:
                font = ImageFont.truetype("arial.ttf", 20)
            except:
                font = ImageFont.load_default()
            
            draw.text((50, 240), f"Mock Image: {prompt[:30]}...", fill='black', font=font)
            draw.text((50, 270), f"Prompt: {prompt[:40]}", fill='darkblue', font=font)
            
            img.save(image_path, 'PNG')
            logger.info(f"Mock image saved: {image_path}")
            
            return f"/static/images/{image_filename}"
        except ImportError:
            logger.warning("PIL not available, returning placeholder URL")
            return "https://via.placeholder.com/512x512?text=Mock+Image"
        except Exception as e:
            logger.error(f"Error creating mock image: {str(e)}")
            return "https://via.placeholder.com/512x512?text=Image+Error"

    def _call_image_api(self, prompt: str) -&gt; Optional[str]:
        try:
            headers = {
                "Authorization": f"Bearer {settings.IMAGE_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "prompt": prompt,
                "n": 1,
                "size": "512x512"
            }
            
            response = requests.post(
                settings.IMAGE_API_URL,
                json=payload,
                headers=headers,
                timeout=30
            )
            response.raise_for_status()
            
            result = response.json()
            
            if "data" in result and len(result["data"]) &gt; 0:
                image_url = result["data"][0].get("url")
                if image_url:
                    return self._save_image_from_url(image_url)
            
            logger.error(f"Invalid image API response: {result}")
            return None
        except Exception as e:
            logger.error(f"Error calling image API: {str(e)}", exc_info=True)
            return None

    def _save_image_from_url(self, image_url: str) -&gt; Optional[str]:
        try:
            response = requests.get(image_url, timeout=30)
            response.raise_for_status()
            
            image_id = str(uuid.uuid4())
            image_filename = f"{image_id}.png"
            image_path = os.path.join(self.images_dir, image_filename)
            
            with open(image_path, 'wb') as f:
                f.write(response.content)
            
            logger.info(f"Image saved from URL: {image_path}")
            return f"/static/images/{image_filename}"
        except Exception as e:
            logger.error(f"Error saving image from URL: {str(e)}", exc_info=True)
            return None

