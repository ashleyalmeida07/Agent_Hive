"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app/app-shell"
import { useAuth } from "@/components/auth/auth-provider"
import { useAccount } from "wagmi"
import { ArrowLeft, Plus, X } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://agent-hive-ld3l.onrender.com"

const CATEGORIES = ["AI/ML", "Image Generation", "NLP", "Audio", "Code", "Data", "Other"]

export default function SellApiPage() {
  const router = useRouter()
  const { user } = useAuth()
  const role = user?.user_metadata?.role || "client"
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"
  const { address } = useAccount()

  const [form, setForm] = useState({
    name: "", description: "", endpoint: "",
    price_per_call: "0.002", category: "AI/ML",
    example_request: "", example_response: "",
  })
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags(ts => [...ts, t])
    setTagInput("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address) return setError("Connect your wallet first")
    if (!form.name || !form.description || !form.endpoint) return setError("Fill in all required fields")

    setSubmitting(true)
    setError("")
    try {
      let exampleRequest = {}
      let exampleResponse = {}
      try { exampleRequest = JSON.parse(form.example_request || "{}") } catch {}
      try { exampleResponse = JSON.parse(form.example_response || "{}") } catch {}

      const res = await fetch(`${API_URL}/api/marketplace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seller_wallet: address,
          name: form.name,
          description: form.description,
          endpoint: form.endpoint,
          price_per_call: parseFloat(form.price_per_call),
          category: form.category,
          tags,
          example_request: exampleRequest,
          example_response: exampleResponse,
        }),
      })
      if (!res.ok) throw new Error("Failed to create listing")
      const data = await res.json()
      router.push(`/marketplace/${data.id}`)
    } catch (e: any) {
      setError(e.message || "Failed to create listing")
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = "w-full rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
  const labelClass = "mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide"

  return (
    <AppShell role={role} userName={userName}>
      <button onClick={() => router.back()} className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-4" /> Back
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">List an API</h1>
        <p className="mt-1 text-sm text-muted-foreground">Publish your AI/ML API to the marketplace and earn MON per call.</p>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-5">
        <div className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur-sm space-y-5">
          <div>
            <label className={labelClass}>API Name *</label>
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Stable Diffusion XL" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Description *</label>
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="What does this API do? Who is it for?"
              rows={3}
              className={inputClass + " resize-none"}
            />
          </div>

          <div>
            <label className={labelClass}>Base Endpoint URL *</label>
            <input value={form.endpoint} onChange={e => set("endpoint", e.target.value)} placeholder="https://api.example.com" className={inputClass} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Category</label>
              <select value={form.category} onChange={e => set("category", e.target.value)} className={inputClass}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Price per Call (MON)</label>
              <input type="number" step="0.001" min="0.001" value={form.price_per_call} onChange={e => set("price_per_call", e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Tags</label>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag() } }}
                placeholder="Add tag, press Enter"
                className={inputClass}
              />
              <button type="button" onClick={addTag} className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Plus className="size-4" />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map(t => (
                  <span key={t} className="flex items-center gap-1 rounded-full bg-secondary/60 px-2.5 py-0.5 text-xs text-foreground">
                    {t}
                    <button type="button" onClick={() => setTags(ts => ts.filter(x => x !== t))}>
                      <X className="size-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur-sm space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Example Request / Response (optional)</h3>
          <div>
            <label className={labelClass}>Example Request (JSON)</label>
            <textarea value={form.example_request} onChange={e => set("example_request", e.target.value)} placeholder='{"prompt": "a cyberpunk bee"}' rows={3} className={inputClass + " resize-none font-mono text-xs"} />
          </div>
          <div>
            <label className={labelClass}>Example Response (JSON)</label>
            <textarea value={form.example_response} onChange={e => set("example_response", e.target.value)} placeholder='{"image_url": "https://..."}' rows={3} className={inputClass + " resize-none font-mono text-xs"} />
          </div>
        </div>

        {error && <p className="rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !address}
          className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Publishing..." : !address ? "Connect Wallet to List" : "Publish API"}
        </button>
      </form>
    </AppShell>
  )
}
