import Link from "next/link"
import { PlusCircle, Wallet, ListChecks, Bot, ArrowRight } from "lucide-react"
import { AppShell } from "@/components/app/app-shell"
import { PageHeader, StatCard } from "@/components/app/page-header"
import { TaskCard } from "@/components/app/task-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExecutorBadge } from "@/components/app/executor-badge"
import {
  currentClient,
  executorMeta,
  splitAmount,
  statusMeta,
  tasks,
  type ExecutorType,
} from "@/lib/data"
import { cn } from "@/lib/utils"

export default function ClientDashboard() {
  const myTasks = tasks.slice(0, 4)

  const routing = (["agent", "freelancer", "both"] as ExecutorType[]).map((e) => {
    const list = tasks.filter((t) => t.executor === e)
    const total = list.reduce((s, t) => s + t.budget, 0)
    return { executor: e, count: list.length, total }
  })
  const grandTotal = routing.reduce((s, r) => s + r.total, 0) || 1

  return (
    <AppShell role="client" userName={currentClient.name}>
      <PageHeader
        title={`Welcome back, ${currentClient.name.split(" ")[0]}`}
        subtitle="Here's what's happening across your tasks."
        action={
          <Button render={<Link href="/tasks/new" />} className="rounded-xl">
            <PlusCircle className="size-4" />
            Post a task
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active tasks"
          value="6"
          hint="3 awaiting review"
          icon={<ListChecks className="size-4.5" />}
        />
        <StatCard
          label="Total spent"
          value={currentClient.spent}
          hint="across 37 tasks"
          icon={<Wallet className="size-4.5" />}
        />
        <StatCard
          label="Agent automations"
          value="14"
          hint="running this month"
          icon={<Bot className="size-4.5" />}
        />
        <StatCard
          label="Hire rate"
          value={`${currentClient.hireRate}%`}
          hint="of posted tasks filled"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Your tasks</h2>
            <Link
              href="/tasks"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {myTasks.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        </div>

        {/* Routing spend breakdown */}
        <Card className="h-fit p-6">
          <h2 className="font-heading text-base font-semibold">Spend by routing</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            How your budget splits across agents and freelancers.
          </p>
          <div className="mt-5 flex flex-col gap-5">
            {routing.map((r) => {
              const a = splitAmount(r.executor, r.total)
              return (
                <div key={r.executor}>
                  <div className="flex items-center justify-between">
                    <ExecutorBadge executor={r.executor} />
                    <span className="text-sm font-medium">
                      ${r.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="bg-primary"
                      style={{ width: `${(a.company / grandTotal) * 100}%` }}
                    />
                    <div
                      className="bg-sky-400"
                      style={{ width: `${(a.freelancer / grandTotal) * 100}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {r.count} task{r.count !== 1 && "s"} ·{" "}
                    {executorMeta[r.executor].label}
                  </p>
                </div>
              )
            })}
          </div>
          <div className="mt-5 flex items-center gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-primary" /> AgentHive
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-sky-400" /> Freelancers
            </span>
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
