import { AgentWorkspace } from "@/components/oneix/agent-workspace"
import { TopNav } from "@/components/oneix/top-nav"

export const metadata = {
  title: "oneix · Agent Workspace",
}

export default function AgentPage() {
  return (
    <div className="min-h-svh bg-background">
      <TopNav />
      <AgentWorkspace />
    </div>
  )
}
