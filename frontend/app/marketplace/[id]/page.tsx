"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppShell } from "@/components/app/app-shell"
import { useAuth } from "@/components/auth/auth-provider"
import { useAccount, useChainId, usePublicClient, useSwitchChain } from "wagmi"
import { useStakeForAPI } from "@/hooks/useBlockchain"
import { keccak256, toBytes, parseEther } from "viem"
import { monadTestnet } from "@reown/appkit/networks"
import { contracts } from "@/lib/contracts"
import { ArrowLeft, Copy, Check, Zap, ExternalLink } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://agent-hive-ld3l.onrender.com"

export default function ApiDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const role = user?.user_metadata?.role || "client"
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"

  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { switchChain } = useSwitchChain()
  const { execute: stake, isPending } = useStakeForAPI()

  const [api, setApi] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`${API_URL}/api/marketplace/${id}`)
      .then(r => r.json())
      .then(setApi)
      .catch(() => setError("Failed to load API"))
      .finally(() => setLoading(false))
  }, [id])

  const handlePurchase = async () => {
    if (!isConnected || !address) return setError("Connect your wallet first")
    if (chainId !== monadTestnet.id) {
      switchChain({ chainId: monadTestnet.id })
      return
    }

    setPurchasing(true)
    setError("")
    try {
      // Derive on-chain IDs from Supabase UUIDs
      const purchaseNonce = crypto.randomUUID()
      const purchaseId = keccak256(toBytes(purchaseNonce)) as `0x${string}`
      const apiIdHash = keccak256(toBytes(id)) as `0x${string}`

      const apiSeller = publicClient
        ? await publicClient.readContract({
            address: contracts.apiEscrow.address,
            abi: contracts.apiEscrow.abi,
            functionName: "apiSellers",
            args: [apiIdHash],
          })
        : "0x0000000000000000000000000000000000000000"

      if (!apiSeller || apiSeller === "0x0000000000000000000000000000000000000000") {
        setError("This API is not registered on-chain yet. Ask the seller to register it before purchasing.")
        return
      }

      // Send stake tx on Monad
      const txHash = await stake("stakeForAPI", [purchaseId, apiIdHash], "0.01")

      // Record purchase in backend
      const res = await fetch(`${API_URL}/api/marketplace/${id}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyer_wallet: address, tx_hash: txHash }),
      })
      const data = await res.json()
      setApiKey(data.purchase?.api_key)
    } catch (e: any) {
      if (!e.message?.includes("User rejected")) {
        setError(e.message || "Purchase failed")
      }
    } finally {
      setPurchasing(false)
    }
  }

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <AppShell role={role} userName={userName}>
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-card/40" />)}
      </div>
    </AppShell>
  )

  if (!api) return (
    <AppShell role={role} userName={userName}>
      <p className="text-muted-foreground">API not found.</p>
    </AppShell>
  )

  return (
    <AppShell role={role} userName={userName}>
      <button onClick={() => router.back()} className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-4" /> Back to marketplace
      </button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur-sm">
            <div className="mb-2 flex items-start gap-3">
              <div className="flex-1">
                <h1 className="text-xl font-bold text-foreground">{api.name}</h1>
                <span className="mt-1 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {api.category}
                </span>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{api.description}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {api.tags?.map((t: string) => (
                <span key={t} className="rounded bg-secondary/60 px-2 py-0.5 text-xs text-muted-foreground">{t}</span>
              ))}
            </div>
          </div>

          {/* Example Request */}
          {api.example_request && Object.keys(api.example_request).length > 0 && (
            <div className="rounded-xl border border-border bg-card/60 p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Example Request</h3>
              <pre className="overflow-x-auto rounded-lg bg-secondary/40 p-3 text-xs text-muted-foreground">
                {JSON.stringify(api.example_request, null, 2)}
              </pre>
            </div>
          )}

          {/* Example Response */}
          {api.example_response && Object.keys(api.example_response).length > 0 && (
            <div className="rounded-xl border border-border bg-card/60 p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Example Response</h3>
              <pre className="overflow-x-auto rounded-lg bg-secondary/40 p-3 text-xs text-muted-foreground">
                {JSON.stringify(api.example_response, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Purchase sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card/60 p-5 backdrop-blur-sm">
            <div className="mb-4 text-center">
              <p className="text-3xl font-bold text-foreground">{api.price_per_call} MON</p>
              <p className="text-xs text-muted-foreground">per API call</p>
            </div>
            <div className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Stake required</span>
                <span className="font-medium text-foreground">0.01 MON</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Call limit</span>
                <span className="font-medium text-foreground">1,000 calls</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Network</span>
                <span className="font-medium text-foreground flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-purple-500 inline-block" />
                  Monad
                </span>
              </div>
            </div>

            {error && <p className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}

            {apiKey ? (
              <div className="space-y-3">
                <p className="text-center text-xs font-medium text-green-400">✓ Purchase successful!</p>
                <div className="rounded-lg border border-border bg-secondary/40 p-3">
                  <p className="mb-1.5 text-xs text-muted-foreground">Your API Key</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate text-xs text-foreground">{apiKey}</code>
                    <button onClick={() => copy(apiKey)} className="shrink-0 rounded p-1 hover:bg-secondary transition-colors">
                      {copied ? <Check className="size-3.5 text-green-400" /> : <Copy className="size-3.5 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
                <p className="text-center text-xs text-muted-foreground">Save this key — it won't be shown again.</p>
              </div>
            ) : (
              <button
                onClick={handlePurchase}
                disabled={purchasing || isPending}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {purchasing || isPending
                  ? "Processing..."
                  : chainId !== monadTestnet.id
                  ? "Switch to Monad"
                  : !isConnected
                  ? "Connect Wallet"
                  : "Purchase — 0.01 MON"}
              </button>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card/60 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="size-3.5 text-primary" />
              <span>{api.total_calls?.toLocaleString() || 0} total calls made</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
