import logging
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


class DomainService:
    DOMAIN_GENERAL = "general"
    DOMAIN_WEIGHT_LOSS = "weight_loss"
    DOMAIN_FITNESS = "fitness"
    DOMAIN_NUTRITION = "nutrition"
    DOMAIN_HEALTH = "health"

    DOMAIN_KEYWORDS: Dict[str, List[str]] = {
        DOMAIN_WEIGHT_LOSS: [
            "减肥", "减重", "瘦身", "减脂", "肥胖", "体重", "BMI", "节食",
            "热量", "卡路里", "代谢", "有氧运动", "瘦身操", "瘦身餐",
            "减肥药", "减肥茶", "减肥法", "减肚子", "瘦腿", "瘦脸",
            "减肥计划", "减肥方法", "减肥食谱", "减肥运动", "体重管理",
            "瘦下来", "变瘦", "减脂增肌", "瘦", "减重"
        ],
        DOMAIN_FITNESS: [
            "健身", "运动", "锻炼", "肌肉", "训练", "力量", "瑜伽", "普拉提",
            "哑铃", "杠铃", "健身房", "健身教练", "健身计划", "腹肌", "马甲线",
            "人鱼线", "胸肌", "背肌", "深蹲", "卧推", "硬拉", "健身器材"
        ],
        DOMAIN_NUTRITION: [
            "营养", "维生素", "蛋白质", "碳水化合物", "脂肪", "膳食纤维",
            "营养素", "补钙", "补铁", "补锌", "营养补充", "营养均衡",
            "营养搭配", "营养早餐", "营养餐", "营养成分", "膳食指南"
        ],
        DOMAIN_HEALTH: [
            "健康", "体检", "疾病", "症状", "治疗", "医疗", "医生", "医院",
            "血压", "血糖", "血脂", "健康管理", "养生", "保健", "康复"
        ]
    }

    DOMAIN_PROMPTS: Dict[str, str] = {
        DOMAIN_GENERAL: "你是一个乐于助人的AI助手，可以回答各种问题，提供有用的信息和建议。",
        DOMAIN_WEIGHT_LOSS: """你是一位专业的减肥顾问，拥有丰富的营养学和运动学知识。你的任务是帮助用户实现健康、可持续的体重管理目标。

你需要提供以下方面的专业建议：
1. **饮食建议**：
   - 合理的热量摄入计算方法
   - 均衡的营养搭配（蛋白质、碳水化合物、脂肪的合理比例）
   - 推荐低热量、高纤维的食物
   - 控制食欲的方法
   - 避免高糖、高脂肪食物的建议

2. **运动指导**：
   - 适合减肥的有氧运动（跑步、游泳、骑车等）
   - 力量训练的重要性和方法
   - 运动频率和时长建议
   - 不同体重基数人群的运动选择

3. **健康减肥知识**：
   - 健康减肥的速度建议（每周0.5-1kg）
   - 基础代谢率（BMR）的概念和计算
   - 如何设定合理的减肥目标
   - 避免极端减肥方法的危害
   - 平台期的应对策略

4. **BMI计算与解读**：
   - BMI计算公式：BMI = 体重(kg) / 身高²(m²)
   - BMI分类标准：
     - 偏瘦：< 18.5
     - 正常：18.5 - 23.9
     - 超重：24 - 27.9
     - 肥胖：≥ 28
   - 注意事项：BMI不适合运动员、孕妇等特殊人群

请以科学、客观、友好的态度回答用户问题，避免提供不安全或极端的减肥建议。强调健康第一，循序渐进的原则。""",
        DOMAIN_FITNESS: "你是一位专业的健身教练，拥有丰富的运动训练知识。你可以为用户提供健身计划、运动技巧、肌肉训练等方面的专业建议。请根据用户的具体情况，提供科学、安全、有效的健身指导。",
        DOMAIN_NUTRITION: "你是一位专业的营养师，拥有丰富的营养学知识。你可以为用户提供营养搭配、健康饮食、营养素补充等方面的专业建议。请根据用户的具体情况，提供科学、实用的营养指导。",
        DOMAIN_HEALTH: "你是一位健康顾问，拥有丰富的健康管理知识。你可以为用户提供健康生活方式、疾病预防、体检解读等方面的专业建议。请注意：你不能替代医生进行诊断和治疗，对于严重健康问题，请建议用户及时就医。"
    }

    @classmethod
    def identify_domain(cls, user_message: str) -> str:
        user_message = user_message.lower()
        
        domain_scores: Dict[str, int] = {}
        
        for domain, keywords in cls.DOMAIN_KEYWORDS.items():
            score = 0
            for keyword in keywords:
                if keyword in user_message:
                    score += 1
            if score > 0:
                domain_scores[domain] = score
        
        if not domain_scores:
            return cls.DOMAIN_GENERAL
        
        sorted_domains = sorted(domain_scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_domains[0][0]

    @classmethod
    def get_system_prompt(cls, domain: str) -> str:
        return cls.DOMAIN_PROMPTS.get(domain, cls.DOMAIN_PROMPTS[cls.DOMAIN_GENERAL])

    @classmethod
    def get_all_domains(cls) -> List[Tuple[str, str]]:
        domain_names = {
            cls.DOMAIN_GENERAL: "通用对话",
            cls.DOMAIN_WEIGHT_LOSS: "减肥顾问",
            cls.DOMAIN_FITNESS: "健身教练",
            cls.DOMAIN_NUTRITION: "营养师",
            cls.DOMAIN_HEALTH: "健康顾问"
        }
        return [(domain, domain_names.get(domain, domain)) for domain in cls.DOMAIN_PROMPTS.keys()]
