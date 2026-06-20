import json
import os
from typing import Any, Callable
from openai import OpenAI
from agents.tools import TOOL_DEFINITIONS, execute_tool, get_workspace_files


PHOTO_SYSTEM_PROMPT = """You are AgentHive PhotoAgent — an expert AI agent that analyzes images and processes visual tasks.

You have access to tools that create real files in a project workspace. USE THEM.

## How You Work
1. Analyze the image provided by the user and the task description.
2. Based on the user's request, create code, reports, or data files that reflect the image's content.
3. Use the `create_file` tool to save your output.
4. After creating the requested files, call `task_complete` with a summary.

## CRITICAL RULES
- You MUST use `create_file` to save your analysis or the resulting code.
- Provide highly detailed visual analysis if the user requests an explanation.
- If the user wants a UI built from a screenshot, write the HTML/CSS and save it via `create_file`.
- Call `task_complete` when finished.
"""


class PhotoAgent:
    """Runs a multi-turn tool-use loop with a Vision-capable LLM."""

    def __init__(self):
        # Prefer OpenRouter for vision if configured, otherwise fallback to default
        base_url = os.getenv("VISION_LLM_BASE_URL") or os.getenv("LLM_BASE_URL", "https://integrate.api.nvidia.com/v1")
        api_key = os.getenv("VISION_LLM_API_KEY") or os.getenv("LLM_API_KEY", "")
        self.client = OpenAI(base_url=base_url, api_key=api_key)
        self.model = os.getenv("VISION_LLM_MODEL", "openai/gpt-4o-mini") # Fallback to openrouter vision model
        self.max_iterations = 10

    def run(self, task: dict, task_id: str, on_event: Callable):
        description = task.get("description", "")
        title = task.get("title", "Task")
        
        # Extract image URL from description
        image_url = None
        desc_lines = description.split('\n')
        for line in desc_lines:
            if "Image URL:" in line:
                image_url = line.split("Image URL:")[1].strip()
                break

        messages = [
            {"role": "system", "content": PHOTO_SYSTEM_PROMPT},
        ]
        
        user_content = [
            {"type": "text", "text": f"## Task: {title}\n## Description:\n{description}\n\nAnalyze the image and complete the task by creating the required files. Call task_complete when finished."}
        ]
        
        if image_url:
            user_content.append({
                "type": "image_url",
                "image_url": {"url": image_url}
            })
            
        messages.append({"role": "user", "content": user_content})

        iteration = 0
        task_done = False

        while iteration < self.max_iterations and not task_done:
            iteration += 1
            on_event({"type": "iteration", "current": iteration, "max": self.max_iterations})

            try:
                # Some vision models don't support tools natively or correctly via all endpoints, 
                # but we will try with tools first.
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    tools=TOOL_DEFINITIONS,
                    tool_choice="auto",
                    temperature=0.5,
                    max_tokens=4096,
                    stream=True,
                )

                content_parts = []
                tool_calls_data = {}

                for chunk in response:
                    if not chunk.choices:
                        continue
                    delta = chunk.choices[0].delta

                    reasoning = getattr(delta, "reasoning_content", None)
                    if reasoning:
                        on_event({"type": "thinking", "text": reasoning})

                    if delta.content:
                        content_parts.append(delta.content)
                        on_event({"type": "content", "text": delta.content})

                    if delta.tool_calls:
                        for tc in delta.tool_calls:
                            idx = tc.index
                            if idx not in tool_calls_data:
                                tool_calls_data[idx] = {"id": tc.id or "", "name": "", "arguments": ""}
                            if tc.id:
                                tool_calls_data[idx]["id"] = tc.id
                            if tc.function:
                                if tc.function.name:
                                    tool_calls_data[idx]["name"] = tc.function.name
                                if tc.function.arguments:
                                    tool_calls_data[idx]["arguments"] += tc.function.arguments

                assistant_msg = {"role": "assistant"}
                full_content = "".join(content_parts)
                if full_content:
                    assistant_msg["content"] = full_content

                if tool_calls_data:
                    tool_calls_list = []
                    for idx in sorted(tool_calls_data.keys()):
                        tc = tool_calls_data[idx]
                        tool_calls_list.append({
                            "id": tc["id"],
                            "type": "function",
                            "function": {"name": tc["name"], "arguments": tc["arguments"]}
                        })
                    assistant_msg["tool_calls"] = tool_calls_list
                    if not full_content:
                        assistant_msg["content"] = None

                    messages.append(assistant_msg)

                    for tc_msg in tool_calls_list:
                        tool_name = tc_msg["function"]["name"]
                        try:
                            args = json.loads(tc_msg["function"]["arguments"])
                        except json.JSONDecodeError:
                            args = {}

                        on_event({"type": "tool_call", "name": tool_name, "args": {k: str(v)[:100] for k, v in args.items()}})
                        result = execute_tool(tool_name, args, task_id)
                        on_event({"type": "tool_result", "name": tool_name, "result": result})

                        if tool_name == "task_complete":
                            task_done = True

                        messages.append({
                            "role": "tool",
                            "tool_call_id": tc_msg["id"],
                            "content": json.dumps(result),
                        })
                else:
                    if full_content:
                        assistant_msg["content"] = full_content
                    messages.append(assistant_msg)
                    if iteration > 2:
                        task_done = True

            except Exception as e:
                on_event({"type": "error", "message": f"Vision API Error: {str(e)}"})
                break

        files = get_workspace_files(task_id)
        on_event({
            "type": "complete",
            "files": files,
            "summary": f"Analyzed image and created {len(files)} files",
            "iterations": iteration,
        })
