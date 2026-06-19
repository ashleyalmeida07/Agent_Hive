import { AppShell } from "@/components/app/app-shell"
import { PageHeader } from "@/components/app/page-header"
import { TaskBrowser } from "@/components/app/task-browser"
import { currentFreelancer } from "@/lib/data"

export default function TasksPage() {
  return (
    <AppShell role="freelancer" userName={currentFreelancer.name}>
      <PageHeader
        title="Find work"
        subtitle="Browse open tasks. Filter by who can take them on — agent, freelancer, or hybrid."
      />
      <TaskBrowser />
    </AppShell>
  )
}
