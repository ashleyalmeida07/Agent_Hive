"""
AgentHive API Gateway — Proxies authenticated calls to purchased AI/ML APIs
and logs usage to Supabase. Header: X-API-Key: <purchase api_key>
"""

import time
import httpx
from fastapi import APIRouter, HTTPException, Header, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from services.supabase_client import get_supabase

router = APIRouter()


class GatewayCallRequest(BaseModel):
    path: str = "/"
    method: str = "POST"
    headers: dict = {}
    body: Optional[dict] = None


@router.post("/call")
async def gateway_call(
    req: GatewayCallRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    db = get_supabase()
    if not db:
        raise HTTPException(status_code=503, detail="DB unavailable")

    # Validate API key → get purchase + listing
    purchase_result = (
        db.table("api_purchases")
        .select("id, api_id, status, calls_made, calls_limit, api_listings(endpoint, price_per_call, name)")
        .eq("api_key", x_api_key)
        .single()
        .execute()
    )
    if not purchase_result.data:
        raise HTTPException(status_code=401, detail="Invalid API key")

    purchase = purchase_result.data
    if purchase["status"] != "active":
        raise HTTPException(status_code=403, detail="API access revoked")
    if purchase["calls_made"] >= purchase["calls_limit"]:
        raise HTTPException(status_code=429, detail="Call quota exceeded. Purchase more access.")

    listing = purchase["api_listings"]
    base_url = listing["endpoint"].rstrip("/")
    target_url = base_url + ("/" if not req.path.startswith("/") else "") + req.path.lstrip("/")

    # Proxy the request
    start = time.monotonic()
    status_code = 502
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.request(
                method=req.method.upper(),
                url=target_url,
                headers=req.headers,
                json=req.body,
            )
            status_code = response.status_code
            response_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"raw": response.text}
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Target API timed out")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gateway error: {str(e)}")
    finally:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        # Log usage regardless of success
        try:
            db.table("api_purchases").update({"calls_made": purchase["calls_made"] + 1}).eq("id", purchase["id"]).execute()
            db.table("api_usage_logs").insert({
                "purchase_id": purchase["id"],
                "api_id": purchase["api_id"],
                "endpoint": target_url,
                "method": req.method.upper(),
                "status_code": status_code,
                "response_ms": elapsed_ms,
            }).execute()
            db.table("api_listings").update({
                "total_calls": db.table("api_listings").select("total_calls").eq("id", purchase["api_id"]).execute().data[0]["total_calls"] + 1
            }).eq("id", purchase["api_id"]).execute()
        except Exception:
            pass  # Never fail the response because of logging

    return JSONResponse(content=response_data, status_code=status_code)


@router.get("/usage")
def get_usage(x_api_key: str = Header(..., alias="X-API-Key")):
    """Return usage stats for the current API key."""
    db = get_supabase()
    if not db:
        raise HTTPException(status_code=503, detail="DB unavailable")

    purchase = (
        db.table("api_purchases")
        .select("calls_made, calls_limit, api_listings(name)")
        .eq("api_key", x_api_key)
        .single()
        .execute()
    )
    if not purchase.data:
        raise HTTPException(status_code=401, detail="Invalid API key")

    return {
        "calls_made": purchase.data["calls_made"],
        "calls_limit": purchase.data["calls_limit"],
        "calls_remaining": purchase.data["calls_limit"] - purchase.data["calls_made"],
        "api_name": purchase.data["api_listings"]["name"],
    }
