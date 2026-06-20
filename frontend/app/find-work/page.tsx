"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, Loader2, Briefcase, DollarSign, Clock } from "lucide-react"
import { AppShell } from "@/components/app/app-shell"
import { useAuth } from "@/components/auth/auth-provider"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase"
import { executorMeta, type ExecutorType, type Task } from "@/lib/data"
import Link from "next/link"

function mapDbTask(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    category: row.category || row.task_type || "Development",
    description: row.description,
    budget: Number(row.bounty_amount),
    executor: row.executor_type || "agent",
    status: row.status || "open",
    client: row.poster_name || "Anonymous",
    postedAgo: getTimeAgo(row.created_at),
    proposals: 0,
    skills: row.skills || row.tags || [],
  }
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

export default function FindWorkPage() {
  const { user } = useAuth()
  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Freelancer"

  const [query, setQuery] = useState("")
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "freelancer" | "both">("all")

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .in("executor_type", ["freelancer", "both"])
        .eq("status", "open")
        .order("created_at", { ascending: false })

      if (!error && data) {
        setTasks(data.map(mapDbTask))
      }
      setLoading(false)
    }
    fetchTasks()
  }, [])

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const byFilter = filter === "all" || t.executor === filter
      const byQuery =
        query.trim() === "" ||
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        t.category.toLowerCase().includes(query.toLowerCase()) ||
        t.skills.some((s) => s.toLowerCase().includes(query.toLowerCase()))
      return byFilter && byQuery
    })
  }, [filter, query, tasks])

  return (
    <AppShell role="freelancer" userName={userName}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Find Work</h1>
          <p className="mt-2 text-muted-foreground">
            Browse tasks available for freelancers. Apply to jobs that match your skills.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, category, or skills..."
              className="pl-9"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                filter === "all"
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("freelancer")}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                filter === "freelancer"
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              Freelancer Only
            </button>
            <button
              onClick={() => setFilter("both")}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                filter === "both"
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              Hybrid
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {filtered.length} task{filtered.length !== 1 ? "s" : ""} available
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="group rounded-xl border border-border bg-card p-5 transition hover:border-primary/50 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold leading-tight group-hover:text-primary">
                        {task.title}
                      </h3>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Briefcase className="size-3.5" />
                        {task.category}
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {executorMeta[task.executor].short}
                    </Badge>
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                    {task.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {task.skills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm">
                    <div className="flex items-center gap-1.5 font-semibold text-primary">
                      <DollarSign className="size-4" />
                      {task.budget.toLocaleString()} MON
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3.5" />
                      {task.postedAgo}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-12 text-center">
                <Briefcase className="mx-auto size-12 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No tasks match your search. Try adjusting your filters.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
