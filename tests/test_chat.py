import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

import pytest
from app.services.domain_service import DomainService


def test_domain_identification():
    service = DomainService()
    
    assert service.identify_domain("我想减肥") == service.DOMAIN_WEIGHT_LOSS
    assert service.identify_domain("我想健身") == service.DOMAIN_FITNESS
    assert service.identify_domain("我想补充营养") == service.DOMAIN_NUTRITION
    assert service.identify_domain("我想了解健康知识") == service.DOMAIN_HEALTH
    assert service.identify_domain("你好") == service.DOMAIN_GENERAL


def test_domain_prompts():
    service = DomainService()
    
    for domain in [
        service.DOMAIN_GENERAL,
        service.DOMAIN_WEIGHT_LOSS,
        service.DOMAIN_FITNESS,
        service.DOMAIN_NUTRITION,
        service.DOMAIN_HEALTH
    ]:
        prompt = service.get_system_prompt(domain)
        assert isinstance(prompt, str)
        assert len(prompt) > 0


def test_get_all_domains():
    service = DomainService()
    domains = service.get_all_domains()
    assert len(domains) > 0
    for domain_id, domain_name in domains:
        assert isinstance(domain_id, str)
        assert isinstance(domain_name, str)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
