"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app/app-shell"
import { useAuth } from "@/components/auth/auth-provider"
import { useAccount } from "wagmi"
import { useWithdrawAPIStake } from "@/hooks/useBlockchain"
import { keccak256, toBytes } from "viem"
import { Copy, Check, Key, TrendingUp, Zap } from "lucide-react"
import { useRouter } from "next/navigation"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://agent-hive-ld3l.onrender.com"

interface Purchase {
  id: string
  api_key: string
  calls_made: number
  calls_limit: number
  status: string
  stake_amount: string
  created_at: string
  tx_hash: string | null
  api_listings: {
    id: string
    name: string
    category: string
    price_per_call: number
  }
}

export default function MyApisPage() {
  const { user } = useAuth()
  const role = user?.user_metadata?.role || "client"
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"

  const { address } = useAccount()
  const { execute: withdraw, isPending } = useWithdrawAPIStake()
  const router = useRouter()

  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [withdrawing, setWithdrawing] = useState<string | null>(null)

  useEffect(() => {
    if (!address) return
    fetch(`${API_URL}/api/marketplace/my-purchases?wallet=${address}`)
      .then(r => r.json())
      .then(d => setPurchases(d.purchases || []))
      .finally(() => setLoading(false))
  }, [address])

  const copy = (key: string, id: string) => {
    navigator.clipboard.writeText(key)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleWithdraw = async (purchase: Purchase) => {
    setWithdrawing(purchase.id)
    try {
      const purchaseIdHash = keccak256(toBytes(purchase.id)) as `0x${string}`
      await withdraw("withdrawStake", [purchaseIdHash])
      // Optimistically update UI
      setPurchases(prev => prev.map(p => p.id === purchase.id ? { ...p, status: "withdrawn" } : p))
    } catch {
      // toast handled by hook
    } finally {
      setWithdrawing(null)
    }
  }

  const totalCalls = purchases.reduce((s, p) => s + p.calls_made, 0)
  const activePurchases = purchases.filter(p => p.status === "active")

  return (
    <AppShell role={role} userName={userName}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My APIs</h1>
          <p className="mt-1 text-sm text-muted-foreground">Purchased APIs and usage stats</p>
        </div>
        <button
          onClick={() => router.push("/marketplace")}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Browse APIs
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Key, label: "Active APIs", value: activePurchases.length },
          { icon: Zap, label: "Total Calls", value: totalCalls.toLocaleString() },
          { icon: TrendingUp, label: "Staked (MON)", value: (activePurchases.length * 0.01).toFixed(2) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-4 rounded-xl border border-border bg-card/60 p-4 backdrop-blur-sm">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Icon className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold text-foreground">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Purchases table */}
      {!address ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">Connect your wallet to view purchases</p>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-card/40" />)}
        </div>
      ) : purchases.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">No purchased APIs yet.</p>
          <button onClick={() => router.push("/marketplace")} className="mt-3 text-sm text-primary hover:underline">
            Browse the marketplace
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {purchases.map(p => (
            <div key={p.id} className="rounded-xl border border-border bg-card/60 p-5 backdrop-blur-sm">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground truncate">{p.api_listings?.name}</h3>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.status === "active" ? "bg-green-500/10 text-green-400" : "bg-secondary/60 text-muted-foreground"
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{p.api_listings?.category}</p>

                  {/* API Key */}
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2">
                    <code className="flex-1 truncate text-xs text-muted-foreground">{p.api_key}</code>
                    <button onClick={() => copy(p.api_key, p.id)} className="shrink-0 rounded p-0.5 hover:bg-secondary transition-colors">
                      {copied === p.id ? <Check className="size-3.5 text-green-400" /> : <Copy className="size-3.5 text-muted-foreground" />}
                    </button>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {/* Usage bar */}
                  <p className="text-xs text-muted-foreground mb-1">
                    {p.calls_made} / {p.calls_limit} calls
                  </p>
                  <div className="w-32 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, (p.calls_made / p.calls_limit) * 100)}%` }}
                    />
                  </div>

                  {p.status === "active" && (
                    <button
                      onClick={() => handleWithdraw(p)}
                      disabled={isPending && withdrawing === p.id}
                      className="mt-3 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-destructive/50 hover:text-destructive transition-colors disabled:opacity-50"
                    >
                      {withdrawing === p.id ? "Withdrawing..." : "Withdraw Stake"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  )
}
