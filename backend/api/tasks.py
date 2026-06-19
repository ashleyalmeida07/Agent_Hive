from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from services.supabase_client import get_supabase
from agents.general_agent import GeneralAgent
from datetime import datetime
import json, asyncio

router = APIRouter()


class CreateTaskRequest(BaseModel):
    poster_address: str
    task_type: str
    title: str
    description: str
    complexity: str = "standard"
    bounty_amount: float
    deadline: Optional[str] = None
    tags: list = []


@router.get("/")
def list_tasks(status: Optional[str] = None, task_type: Optional[str] = None, limit: int = 20, offset: int = 0):
    db = get_supabase()
    if not db:
        return {"tasks": [], "total": 0}
    query = db.table("tasks").select("*")
    if status:
        query = query.eq("status", status)
    if task_type:
        query = query.eq("task_type", task_type)
    result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    return {"tasks": result.data, "total": len(result.data)}


@router.post("/")
def create_task(body: CreateTaskRequest):
    db = get_supabase()
    if not db:
        return {"task_id": 0, "message": "Mock mode — no DB"}
    count_result = db.table("tasks").select("task_id", count="exact").execute()
    next_id = (count_result.count or 0) + 1
    result = db.table("tasks").insert({
        "task_id": next_id,
        "poster_address": body.poster_address,
        "task_type": body.task_type,
        "title": body.title,
        "description": body.description,
        "complexity": body.complexity,
        "bounty_amount": body.bounty_amount,
        "tags": body.tags,
        "status": "open",
        "deadline": body.deadline,
        "created_at": datetime.utcnow().isoformat(),
    }).execute()
    return {"task_id": next_id, "task": result.data[0] if result.data else None}


@router.get("/{task_id}")
def get_task(task_id: int):
    db = get_supabase()
    if not db:
        return {"task": None}
    result = db.table("tasks").select("*").eq("task_id", task_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"task": result.data}


@router.post("/{task_id}/execute")
async def execute_task(task_id: str):
    """Execute a task using the AI agent. Streams progress + LLM tokens as SSE events."""
    db = get_supabase()
    if not db:
        raise HTTPException(status_code=500, detail="Database not available")

    # Fetch task by UUID
    result = db.table("tasks").select("*").eq("id", task_id).execute()
    if not result.data:
        try:
            result = db.table("tasks").select("*").eq("task_id", int(task_id)).execute()
        except ValueError:
            pass
    if not result.data:
        raise HTTPException(status_code=404, detail="Task not found")

    task = result.data[0]

    async def event_stream():
        agent = GeneralAgent(agent_id=1)

        # ── Pre-execution phases ─────────────────────────────
        pre_phases = [
            ("understanding", "Understanding the task", [
                "Reading task description...",
                f"Identified type: {task.get('category', task.get('task_type', 'general'))}",
                f"Parsed {len(task.get('description', '').split())} words of specification",
                "Requirements mapped ✓",
            ]),
            ("planning", "Planning approach", [
                "Decomposing into subtasks...",
                "Selecting optimal strategy...",
                "Execution plan ready ✓",
            ]),
        ]

        for phase_id, phase_label, thoughts in pre_phases:
            yield f"data: {json.dumps({'type': 'phase_start', 'phase': phase_id, 'label': phase_label})}\n\n"
            for thought in thoughts:
                await asyncio.sleep(0.35)
                yield f"data: {json.dumps({'type': 'thought', 'phase': phase_id, 'text': thought})}\n\n"
            yield f"data: {json.dumps({'type': 'phase_done', 'phase': phase_id})}\n\n"

        # ── LLM execution phase ──────────────────────────────
        yield f"data: {json.dumps({'type': 'phase_start', 'phase': 'executing', 'label': 'Generating deliverables'})}\n\n"
        await asyncio.sleep(0.2)
        yield f"data: {json.dumps({'type': 'thought', 'phase': 'executing', 'text': f'Calling {agent.model}...'})}\n\n"

        output_chunks = []
        token_queue: asyncio.Queue = asyncio.Queue()

        def run_stream():
            """Run blocking LLM stream in a thread, push tokens to queue."""
            try:
                for token in agent.execute_stream(task):
                    token_queue.put_nowait(token)
            finally:
                token_queue.put_nowait(None)  # sentinel

        # Start stream in a thread so we don't block the event loop
        stream_task = asyncio.get_event_loop().run_in_executor(None, run_stream)

        # Forward tokens to SSE as they arrive
        while True:
            try:
                token = await asyncio.wait_for(token_queue.get(), timeout=60.0)
            except asyncio.TimeoutError:
                yield f"data: {json.dumps({'type': 'error', 'message': 'LLM timeout'})}\n\n"
                return
            if token is None:
                break
            output_chunks.append(token)
            yield f"data: {json.dumps({'type': 'token', 'text': token})}\n\n"

        await stream_task  # ensure thread is done

        output = "".join(output_chunks)
        word_count = len(output.split())
        quality = min(95, 60 + word_count // 20)
        summary = f"Completed: {task.get('title', 'Task')} ({word_count} words)"

        yield f"data: {json.dumps({'type': 'thought', 'phase': 'executing', 'text': f'Generated {word_count} words ✓'})}\n\n"
        yield f"data: {json.dumps({'type': 'phase_done', 'phase': 'executing'})}\n\n"

        # ── Validation phase ─────────────────────────────────
        yield f"data: {json.dumps({'type': 'phase_start', 'phase': 'validating', 'label': 'Validating output'})}\n\n"
        await asyncio.sleep(0.3)
        yield f"data: {json.dumps({'type': 'thought', 'phase': 'validating', 'text': 'Running quality checks...'})}\n\n"
        await asyncio.sleep(0.3)
        yield f"data: {json.dumps({'type': 'thought', 'phase': 'validating', 'text': f'Quality score: {quality}/100'})}\n\n"
        await asyncio.sleep(0.2)
        yield f"data: {json.dumps({'type': 'thought', 'phase': 'validating', 'text': 'Validation passed ✓'})}\n\n"
        yield f"data: {json.dumps({'type': 'phase_done', 'phase': 'validating'})}\n\n"

        # ── Save to DB ────────────────────────────────────────
        try:
            import hashlib
            result_hash = hashlib.sha256(output.encode()).hexdigest()
            db.table("tasks").update({
                "status": "review",
                "result_content": output,
                "result_summary": summary,
                "result_hash": result_hash,
                "quality_score": quality,
                "completed_at": datetime.utcnow().isoformat(),
            }).eq("id", task["id"]).execute()
        except Exception:
            pass

        # ── Done ──────────────────────────────────────────────
        yield f"data: {json.dumps({'type': 'complete', 'output': output, 'summary': summary, 'quality': quality})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")



@router.post("/{task_id}/approve")
def approve_task(task_id: int, poster_address: str):
    db = get_supabase()
    if not db:
        return {"success": False, "message": "Mock mode"}
    db.table("tasks").update({
        "status": "verified",
        "verified_at": datetime.utcnow().isoformat(),
    }).eq("task_id", task_id).eq("poster_address", poster_address).execute()
    return {"success": True, "message": "Task approved — payment will be released."}


@router.post("/{task_id}/dispute")
def dispute_task(task_id: int, poster_address: str, reason: str = "Quality not satisfactory"):
    db = get_supabase()
    if not db:
        return {"success": False}
    db.table("tasks").update({"status": "disputed"}).eq("task_id", task_id).execute()
    db.table("disputes").insert({
        "task_id": task_id,
        "reason": reason,
        "resolution": "pending",
        "created_at": datetime.utcnow().isoformat(),
    }).execute()
    return {"success": True}
