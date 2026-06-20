"""
AgentHive API Marketplace — CRUD endpoints for AI/ML API listings.
"""

import secrets
import uuid
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from services.supabase_client import get_supabase
from services.api_escrow_client import ensure_api_registered

router = APIRouter()


class CreateListingRequest(BaseModel):
    seller_wallet: str
    name: str
    description: str
    endpoint: str
    price_per_call: float = 0.002
    category: str = "AI/ML"
    tags: list = []
    example_request: dict = {}
    example_response: dict = {}


class PurchaseRequest(BaseModel):
    buyer_wallet: str
    tx_hash: Optional[str] = None


@router.get("/")
def list_apis(
    search: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = Query(20, le=100),
    offset: int = 0,
):
    db = get_supabase()
    if not db:
        return {"apis": [], "total": 0}

    query = db.table("api_listings").select("*").eq("status", "active")

    if category and category != "All":
        query = query.eq("category", category)

    if search:
        # Use Postgres full-text search
        query = query.text_search("name,description", search, config="english")

    result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    return {"apis": result.data, "total": len(result.data)}


@router.get("/categories")
def get_categories():
    db = get_supabase()
    if not db:
        return {"categories": ["All", "AI/ML", "Image Generation", "NLP", "Audio", "Code"]}
    result = db.table("api_listings").select("category").eq("status", "active").execute()
    cats = sorted(set(r["category"] for r in result.data))
    return {"categories": ["All"] + cats}


@router.get("/my-apis")
def my_apis(wallet: str = Query(...)):
    db = get_supabase()
    if not db:
        return {"apis": []}
    result = db.table("api_listings").select("*").eq("seller_wallet", wallet).execute()
    return {"apis": result.data}


@router.get("/my-purchases")
def my_purchases(wallet: str = Query(...)):
    db = get_supabase()
    if not db:
        return {"purchases": []}
    result = (
        db.table("api_purchases")
        .select("*, api_listings(*)")
        .eq("buyer_wallet", wallet)
        .order("created_at", desc=True)
        .execute()
    )
    return {"purchases": result.data}


@router.get("/{api_id}")
def get_api(api_id: str):
    db = get_supabase()
    if not db:
        raise HTTPException(status_code=503, detail="DB unavailable")
    result = db.table("api_listings").select("*").eq("id", api_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="API not found")
    return result.data


@router.post("/")
def create_listing(body: CreateListingRequest):
    db = get_supabase()
    if not db:
        raise HTTPException(status_code=503, detail="DB unavailable")

    api_id = str(uuid.uuid4())
    if not ensure_api_registered(api_id, body.seller_wallet):
        raise HTTPException(status_code=502, detail="Failed to register API on-chain")

    result = db.table("api_listings").insert({
        "id": api_id,
        "seller_wallet": body.seller_wallet,
        "name": body.name,
        "description": body.description,
        "endpoint": body.endpoint,
        "price_per_call": body.price_per_call,
        "category": body.category,
        "tags": body.tags,
        "example_request": body.example_request,
        "example_response": body.example_response,
    }).execute()
    return result.data[0]


@router.post("/{api_id}/purchase")
def purchase_api(api_id: str, body: PurchaseRequest):
    db = get_supabase()
    if not db:
        raise HTTPException(status_code=503, detail="DB unavailable")

    # Verify API exists
    api = db.table("api_listings").select("id,name,price_per_call").eq("id", api_id).single().execute()
    if not api.data:
        raise HTTPException(status_code=404, detail="API not found")

    # Check for existing active purchase
    existing = (
        db.table("api_purchases")
        .select("id,api_key")
        .eq("buyer_wallet", body.buyer_wallet)
        .eq("api_id", api_id)
        .eq("status", "active")
        .execute()
    )
    if existing.data:
        return {"purchase": existing.data[0], "already_purchased": True}

    api_key = secrets.token_urlsafe(32)
    result = db.table("api_purchases").insert({
        "buyer_wallet": body.buyer_wallet,
        "api_id": api_id,
        "api_key": api_key,
        "tx_hash": body.tx_hash,
        "stake_amount": "0.01",
    }).execute()
    return {"purchase": result.data[0], "already_purchased": False}


@router.delete("/{api_id}")
def delete_listing(api_id: str, wallet: str = Query(...)):
    db = get_supabase()
    if not db:
        raise HTTPException(status_code=503, detail="DB unavailable")
    db.table("api_listings").update({"status": "deleted"}).eq("id", api_id).eq("seller_wallet", wallet).execute()
    return {"ok": True}
