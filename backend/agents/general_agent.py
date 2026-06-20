from agents.base_agent import BaseAgent
from typing import Dict, Any
from openai import OpenAI
import os


GENERAL_SYSTEM_PROMPT = """You are AgentHive WorkerBot — a versatile AI agent that executes any task assigned to you with high quality.

You are given a task with a title and description. You MUST produce complete, usable deliverables.

Rules:
1. If the task asks for code (website, app, script, etc.), produce COMPLETE working code — full files, not snippets
2. If the task asks for content (blog, copy, etc.), produce the complete content
3. If the task asks for analysis, produce structured analysis with findings
4. If the task asks for design, produce detailed specifications and CSS/HTML
5. Always produce deliverables that can be used immediately without further work
6. Use markdown formatting for structure
7. For code tasks: wrap each file in a code block with the filename as a comment on the first line
8. Be thorough — produce quality work that justifies the budget

You are being evaluated on quality. Produce professional-grade output."""


class GeneralAgent(BaseAgent):
    """General-purpose AI agent that handles any task type using Nvidia NIM."""

    def __init__(self, agent_id: int = 1):
        super().__init__(
            agent_id=agent_id,
            agent_type="general",
            name=f"WorkerBot #{agent_id}",
        )
        self.client = OpenAI(
            base_url=os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1"),
            api_key=os.getenv("NVIDIA_API_KEY"),
        )
        self.model = os.getenv("NVIDIA_MODEL", "nvidia/llama-3.1-nemotron-nano-8b-v1")

    def _build_messages(self, task: dict) -> list:
        description = task.get("description", "")
        title = task.get("title", "Task")
        category = task.get("category", task.get("task_type", "general"))
        return [
            {"role": "system", "content": GENERAL_SYSTEM_PROMPT},
            {"role": "user", "content": (
                f"## Task: {title}\n"
                f"## Category: {category}\n"
                f"## Description:\n{description}\n\n"
                "Produce complete, usable deliverables for this task. "
                "If code is requested, produce full working files. "
                "If content is requested, produce the complete content."
            )},
        ]

    def execute_stream(self, task: dict):
        """Yield text tokens as they arrive from the LLM (sync generator)."""
        stream = self.client.chat.completions.create(
            model=self.model,
            messages=self._build_messages(task),
            temperature=0.6,
            top_p=0.95,
            max_tokens=4096,
            stream=True,
        )
        for chunk in stream:
            token = chunk.choices[0].delta.content or ""
            if token:
                yield token

    async def execute(self, task: dict) -> Dict[str, Any]:
        """Consume the full stream and return a result dict (used by run_cycle)."""
        output = "".join(self.execute_stream(task))

        title = task.get("title", "Task")
        word_count = len(output.split())
        quality = min(95, 60 + word_count // 20)

        return {
            "output": output,
            "summary": f"Completed: {title} ({word_count} words generated)",
            "quality_estimate": quality,
        }
