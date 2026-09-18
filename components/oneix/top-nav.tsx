"use client"

import { cn } from "@/lib/utils"
import { ThemeToggle } from "./theme-toggle"

export function TopNav({
  view,
  onViewChange,
}: {
  view: "customer" | "agent"
  onViewChange: (v: "customer" | "agent") => void
}) {
  return (
    <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-3">
        <div className="flex size-6 items-center justify-center rounded-md bg-teal-500 text-xs font-bold text-white">
          O
        </div>
        <span className="text-sm font-medium text-foreground">oneix</span>
        <span className="text-sm text-muted-foreground/50">·</span>
        <span className="text-sm text-muted-foreground">AI CX Demo</span>
      </div>

      <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
        <button
          onClick={() => onViewChange("customer")}
          className={cn(
            "rounded-md px-2 py-1 text-[11px] font-medium transition-colors sm:px-3 sm:text-xs",
            view === "customer"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Customer View
        </button>
        <button
          onClick={() => onViewChange("agent")}
          className={cn(
            "rounded-md px-2 py-1 text-[11px] font-medium transition-colors sm:px-3 sm:text-xs",
            view === "agent"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Agent Workspace
        </button>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
      </div>
    </header>
  )
}
