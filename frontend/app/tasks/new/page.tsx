import { AppShell } from "@/components/app/app-shell"
import { PageHeader } from "@/components/app/page-header"
import { CreateTaskForm } from "@/components/app/create-task-form"
import { currentClient } from "@/lib/data"

export default function NewTaskPage() {
  return (
    <AppShell role="client" userName={currentClient.name}>
      <PageHeader
        title="Post a task"
        subtitle="Describe what you need, pick who does it, and we'll route the payment automatically."
      />
      <CreateTaskForm />
    </AppShell>
  )
}
