from agents.base_agent import BaseAgent
from typing import Dict, Any
import openai
import os


AUDIT_SYSTEM_PROMPT = """You are AuditBot, an expert Solidity smart contract security auditor with deep knowledge of:
- Common vulnerability patterns (reentrancy, integer overflow, access control, front-running, etc.)
- ERC standards (ERC-20, ERC-721, ERC-1155) and their correct implementations
- Gas optimization techniques
- OpenZeppelin security best practices

When auditing a contract, always:
1. Check for reentrancy vulnerabilities
2. Check for integer overflow/underflow
3. Check access control patterns
4. Check for unchecked external calls
5. Check for gas optimization opportunities
6. Provide specific line numbers and fix recommendations

Format your output as a structured security report with CRITICAL, HIGH, MEDIUM, LOW, and INFO categories."""


class AuditAgent(BaseAgent):
    """AI-powered Solidity smart contract security auditor."""

    def __init__(self, agent_id: int):
        super().__init__(agent_id=agent_id, agent_type="audit", name=f"AuditBot #{agent_id}")
        self.client = openai.AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    async def execute(self, task: dict) -> Dict[str, Any]:
        description = task.get("description", "")
        title       = task.get("title", "Smart contract audit")

        messages = [
            {"role": "system",  "content": AUDIT_SYSTEM_PROMPT},
            {"role": "user",    "content": f"Task: {title}\n\nDetails / Code:\n{description}"},
        ]

        response = await self.client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            max_tokens=2000,
            temperature=0.2,
        )

        output = response.choices[0].message.content

        # Estimate quality based on response length and content
        quality = min(95, 70 + len(output) // 100)
        if "CRITICAL" in output.upper(): quality = min(quality + 10, 95)

        return {
            "output":           output,
            "summary":          f"Security audit completed. Found vulnerabilities in: {title}",
            "quality_estimate": quality,
        }
