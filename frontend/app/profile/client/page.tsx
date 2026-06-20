import { MapPin, Building2, BadgeCheck } from "lucide-react"
import { AppShell } from "@/components/app/app-shell"
import { PageHeader, StatCard } from "@/components/app/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar } from "@/components/ui/avatar"
import { currentClient } from "@/lib/data"

export default function ClientProfilePage() {
  const c = currentClient
  return (
    <AppShell role="client" userName={c.name}>
      <PageHeader title="Profile & settings" subtitle="Manage your account and company details." />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Avatar name={c.name} className="size-16 text-lg" />
              <div>
                <h2 className="font-heading text-xl font-semibold">{c.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {c.company} · {c.location}
                </p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <BadgeCheck className="size-3.5" /> Verified
              </span>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-heading text-base font-semibold">Account details</h3>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Full name" defaultValue={c.name} />
              <Field label="Company" defaultValue={c.company} icon={<Building2 className="size-4" />} />
              <Field label="Email" defaultValue={c.email} type="email" />
              <Field label="Location" defaultValue={c.location} icon={<MapPin className="size-4" />} />
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <Label htmlFor="about">About your company</Label>
              <Textarea
                id="about"
                rows={4}
                defaultValue="Northwind Labs builds data infrastructure for fast-growing teams. We post automation and analytics tasks regularly."
              />
            </div>
            <div className="mt-5 flex justify-end">
              <Button className="rounded-xl">Save changes</Button>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <StatCard label="Total spent" value={c.spent} hint="all-time" />
          <StatCard label="Tasks posted" value={String(c.postedTasks)} />
          <StatCard label="Hire rate" value={`${c.hireRate}%`} hint="tasks successfully filled" />
        </div>
      </div>
    </AppShell>
  )
}

function Field({
  label,
  defaultValue,
  type = "text",
  icon,
}: {
  label: string
  defaultValue: string
  type?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
        )}
        <Input type={type} defaultValue={defaultValue} className={icon ? "pl-9" : undefined} />
      </div>
    </div>
  )
}
