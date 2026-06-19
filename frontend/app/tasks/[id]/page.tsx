import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  Clock,
  Users2,
  Building2,
  User,
  CheckCircle2,
} from "lucide-react"
import { AppShell } from "@/components/app/app-shell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { ExecutorBadge } from "@/components/app/executor-badge"
import {
  currentFreelancer,
  executorMeta,
  getTask,
  getPaymentSplit,
  splitAmount,
  statusMeta,
} from "@/lib/data"
import { cn } from "@/lib/utils"

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const task = getTask(id)
  if (!task) notFound()

  const split = getPaymentSplit(task.executor)
  const amounts = splitAmount(task.executor, task.budget)
  const status = statusMeta[task.status]

  return (
    <AppShell role="freelancer" userName={currentFreelancer.name}>
      <Link
        href="/tasks"
        className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to tasks
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {task.category}
              </span>
              <span className="text-muted-foreground">·</span>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-xs font-medium",
                  status.tone,
                )}
              >
                {status.label}
              </span>
              <ExecutorBadge executor={task.executor} className="ml-auto" />
            </div>

            <h1 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-balance">
              {task.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" />
                {task.postedAgo}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users2 className="size-4" />
                {task.proposals} proposals
              </span>
            </div>

            <div className="mt-6 border-t border-border pt-6">
              <h2 className="font-heading text-base font-semibold">
                Description
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {task.description}
              </p>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium">Skills required</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {task.skills.map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-heading text-base font-semibold">
              How this task runs
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {executorMeta[task.executor].description}
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {(task.executor === "agent" || task.executor === "both") && (
                <Step
                  icon={<Building2 className="size-4" />}
                  title="AgentHive agent"
                  text="An in-house AI agent executes its portion of the work autonomously."
                />
              )}
              {(task.executor === "freelancer" || task.executor === "both") && (
                <Step
                  icon={<User className="size-4" />}
                  title="Human freelancer"
                  text="A vetted freelancer delivers (or refines) the work and submits for review."
                />
              )}
              <Step
                icon={<CheckCircle2 className="size-4" />}
                title="Release & payout"
                text="On approval, escrow releases funds along the routing split below."
              />
            </div>
          </Card>
        </div>

        {/* Sidebar: budget + payment + apply */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Fixed budget</p>
            <p className="mt-1 font-heading text-3xl font-semibold tracking-tight">
              ${task.budget.toLocaleString()}
            </p>

            <div className="mt-5">
              <p className="mb-2 text-sm font-medium">Payment routing</p>
              <div className="flex h-2.5 overflow-hidden rounded-full bg-secondary">
                <div className="bg-primary" style={{ width: `${split.company}%` }} />
                <div
                  className="bg-sky-400"
                  style={{ width: `${split.freelancer}%` }}
                />
              </div>
              <div className="mt-4 flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <span className="size-2.5 rounded-full bg-primary" />
                    AgentHive
                  </span>
                  <span className="font-medium">
                    ${amounts.company.toLocaleString()} ({split.company}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <span className="size-2.5 rounded-full bg-sky-400" />
                    Freelancer
                  </span>
                  <span className="font-medium">
                    ${amounts.freelancer.toLocaleString()} ({split.freelancer}%)
                  </span>
                </div>
              </div>
            </div>

            {task.executor !== "agent" ? (
              <Button size="lg" className="mt-6 w-full rounded-xl">
                Submit a proposal
              </Button>
            ) : (
              <div className="mt-6 rounded-xl border border-border bg-secondary/40 p-3 text-center text-xs text-muted-foreground">
                This task is handled by an AgentHive agent and isn&apos;t open to
                freelancer proposals.
              </div>
            )}
          </Card>

          <Card className="p-5">
            <p className="text-sm font-medium">Posted by</p>
            <div className="mt-3 flex items-center gap-3">
              <Avatar name={task.client} />
              <div>
                <p className="text-sm font-medium">{task.client}</p>
                <p className="text-xs text-muted-foreground">Verified client</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}

function Step({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode
  title: string
  text: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-secondary/30 p-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
        {icon}
      </span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{text}</p>
      </div>
    </div>
  )
}
