"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app/app-shell"
import { useAuth } from "@/components/auth/auth-provider"
import { Search, Zap, Tag } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://agent-hive-ld3l.onrender.com"

interface ApiListing {
  id: string
  name: string
  description: string
  price_per_call: number
  category: string
  tags: string[]
  total_calls: number
  seller_wallet: string
}

function ApiCard({ api }: { api: ApiListing }) {
  const router = useRouter()
  return (
    <div
      onClick={() => router.push(`/marketplace/${api.id}`)}
      className="group cursor-pointer rounded-xl border border-border bg-card/60 p-5 backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-card hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {api.name}
        </h3>
        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          {api.category}
        </span>
      </div>
      <p className="mb-4 text-sm text-muted-foreground line-clamp-2">{api.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Zap className="size-3" />
          <span>{api.total_calls.toLocaleString()} calls</span>
        </div>
        <span className="text-sm font-semibold text-foreground">
          {api.price_per_call} MON
          <span className="text-xs font-normal text-muted-foreground"> / call</span>
        </span>
      </div>
      {api.tags?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {api.tags.slice(0, 3).map((tag: string) => (
            <span key={tag} className="rounded bg-secondary/60 px-1.5 py-0.5 text-xs text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function MarketplacePage() {
  const { user } = useAuth()
  const role = user?.user_metadata?.role || "client"
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"

  const [apis, setApis] = useState<ApiListing[]>([])
  const [categories, setCategories] = useState<string[]>(["All"])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [loading, setLoading] = useState(true)

  const fetchApis = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (category !== "All") params.set("category", category)
      const res = await fetch(`${API_URL}/api/marketplace?${params}`)
      const data = await res.json()
      setApis(data.apis || [])
    } catch {
      setApis([])
    } finally {
      setLoading(false)
    }
  }, [search, category])

  useEffect(() => {
    fetch(`${API_URL}/api/marketplace/categories`)
      .then(r => r.json())
      .then(d => setCategories(d.categories || ["All"]))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const t = setTimeout(fetchApis, 300)
    return () => clearTimeout(t)
  }, [fetchApis])

  return (
    <AppShell role={role} userName={userName}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">API Marketplace</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Discover and purchase AI/ML APIs. Pay per call, staked trustlessly on Monad.
        </p>
      </div>

      {/* Search + Filter */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search APIs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary/40 py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                category === cat
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl border border-border bg-card/40" />
          ))}
        </div>
      ) : apis.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <Tag className="mb-3 size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No APIs found. Try a different search.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apis.map(api => <ApiCard key={api.id} api={api} />)}
        </div>
      )}
    </AppShell>
  )
}
