from __future__ import annotations

import logging
from typing import Any

from web3 import Web3

from config import settings
from services.supabase_client import get_supabase

logger = logging.getLogger(__name__)

API_ESCROW_ABI: list[dict[str, Any]] = [
    {
        "inputs": [{"internalType": "bytes32", "name": "apiId", "type": "bytes32"}],
        "name": "apiSellers",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "apiId", "type": "bytes32"},
            {"internalType": "address", "name": "seller", "type": "address"},
        ],
        "name": "registerAPI",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
]

MONAD_CHAIN_ID = 10143


def _get_web3() -> Web3 | None:
    if not settings.monad_rpc_url or not settings.private_key or not settings.api_escrow_address:
        return None

    web3 = Web3(Web3.HTTPProvider(settings.monad_rpc_url))
    if not web3.is_connected():
        return None

    return web3


def _get_contract(web3: Web3):
    return web3.eth.contract(
        address=Web3.to_checksum_address(settings.api_escrow_address),
        abi=API_ESCROW_ABI,
    )


def _to_api_hash(api_id: str) -> bytes:
    return Web3.keccak(text=api_id)


def ensure_api_registered(api_id: str, seller_wallet: str) -> bool:
    web3 = _get_web3()
    if not web3:
        logger.warning("Skipping API escrow registration for %s: web3 not configured", api_id)
        return False

    try:
        contract = _get_contract(web3)
        seller_address = Web3.to_checksum_address(seller_wallet)
        api_hash = _to_api_hash(api_id)

        current_seller = contract.functions.apiSellers(api_hash).call()
        if current_seller and Web3.to_checksum_address(current_seller) == seller_address:
            return True

        account = web3.eth.account.from_key(settings.private_key)
        tx = contract.functions.registerAPI(api_hash, seller_address).build_transaction(
            {
                "from": account.address,
                "nonce": web3.eth.get_transaction_count(account.address),
                "chainId": MONAD_CHAIN_ID,
                "gasPrice": web3.eth.gas_price,
            }
        )
        if "gas" not in tx:
            tx["gas"] = web3.eth.estimate_gas(tx)

        signed_tx = account.sign_transaction(tx)
        tx_hash = web3.eth.send_raw_transaction(signed_tx.raw_transaction)
        receipt = web3.eth.wait_for_transaction_receipt(tx_hash)
        return receipt.status == 1
    except Exception as exc:
        logger.exception("Failed to register API %s on-chain: %s", api_id, exc)
        return False


def backfill_active_api_registrations() -> dict[str, int]:
    db = get_supabase()
    if not db:
        return {"registered": 0, "skipped": 0, "failed": 0}

    result = db.table("api_listings").select("id,seller_wallet").eq("status", "active").execute()
    listings = result.data or []

    summary = {"registered": 0, "skipped": 0, "failed": 0}
    for listing in listings:
        api_id = listing.get("id")
        seller_wallet = listing.get("seller_wallet")
        if not api_id or not seller_wallet:
            summary["failed"] += 1
            continue

        if ensure_api_registered(api_id, seller_wallet):
            summary["registered"] += 1
        else:
            summary["failed"] += 1

    return summary