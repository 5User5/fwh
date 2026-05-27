import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

import pytest
from app.services.model_service import ModelService


def test_mock_response():
    service = ModelService()
    service.use_mock = True
    
    messages = [{"role": "user", "content": "Hello"}]
    response = service.chat(messages)
    
    assert response is not None
    assert "choices" in response
    assert len(response["choices"]) > 0
    assert "message" in response["choices"][0]
    assert "content" in response["choices"][0]["message"]


def test_simple_chat_with_mock():
    service = ModelService()
    service.use_mock = True
    
    response = service.simple_chat("Hello World")
    
    assert isinstance(response, str)
    assert len(response) > 0


def test_initialization():
    service = ModelService()
    assert hasattr(service, 'api_url')
    assert hasattr(service, 'use_mock')
    assert hasattr(service, 'timeout')


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
