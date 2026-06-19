"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { TaskCard } from "@/components/app/task-card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { executorMeta, tasks, type ExecutorType } from "@/lib/data"

type ExecFilter = ExecutorType | "all"

const execFilters: { id: ExecFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "agent", label: executorMeta.agent.short },
  { id: "freelancer", label: executorMeta.freelancer.short },
  { id: "both", label: executorMeta.both.short },
]

export function TaskBrowser() {
  const [exec, setExec] = useState<ExecFilter>("all")
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const byExec = exec === "all" || t.executor === exec
      const byQuery =
        query.trim() === "" ||
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        t.skills.some((s) => s.toLowerCase().includes(query.toLowerCase()))
      return byExec && byQuery
    })
  }, [exec, query])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks or skills..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {execFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => setExec(f.id)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                exec === f.id
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} task{filtered.length !== 1 && "s"} available
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((t) => (
          <TaskCard key={t.id} task={t} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No tasks match your filters.
        </div>
      )}
    </div>
  )
}
