from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.supabase_client import get_supabase
from datetime import datetime

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
