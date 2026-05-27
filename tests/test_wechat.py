import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

import pytest
from app.api.wechat import check_signature, parse_message, create_text_reply
from app.core.config import settings


def test_check_signature():
    settings.WECHAT_TOKEN = "test_token"
    signature = "test_signature"
    timestamp = "1234567890"
    nonce = "test_nonce"
    result = check_signature(signature, timestamp, nonce)
    assert isinstance(result, bool)


def test_parse_message():
    xml_data = """<xml>
<ToUserName><![CDATA[test_to]]></ToUserName>
<FromUserName><![CDATA[test_from]]></FromUserName>
<CreateTime>1234567890</CreateTime>
<MsgType><![CDATA[text]]></MsgType>
<Content><![CDATA[test content]]></Content>
</xml>"""
    msg = parse_message(xml_data)
    assert msg["ToUserName"] == "test_to"
    assert msg["FromUserName"] == "test_from"
    assert msg["MsgType"] == "text"
    assert msg["Content"] == "test content"


def test_create_text_reply():
    reply = create_text_reply("user1", "user2", "Hello World")
    assert "<ToUserName><![CDATA[user1]]></ToUserName>" in reply
    assert "<FromUserName><![CDATA[user2]]></FromUserName>" in reply
    assert "<Content><![CDATA[Hello World]]></Content>" in reply


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
