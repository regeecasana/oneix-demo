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
    <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-white/10 bg-[#0a1520] px-4">
      <div className="flex items-center gap-3">
        <div className="flex size-6 items-center justify-center rounded-md bg-teal-500 text-xs font-bold text-[#0a1520]">
          O
        </div>
        <span className="text-sm font-medium text-white">oneix</span>
        <span className="text-sm text-white/30">·</span>
        <span className="text-sm text-white/50">AI CX Demo</span>
      </div>

      <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1">
        <button
          onClick={() => onViewChange("customer")}
          className={cn(
            "rounded-md px-2 py-1 text-[11px] font-medium transition-colors sm:px-3 sm:text-xs",
            view === "customer" ? "bg-white text-[#0a1520]" : "text-white/60 hover:text-white",
          )}
        >
          Customer View
        </button>
        <button
          onClick={() => onViewChange("agent")}
          className={cn(
            "rounded-md px-2 py-1 text-[11px] font-medium transition-colors sm:px-3 sm:text-xs",
            view === "agent" ? "bg-white text-[#0a1520]" : "text-white/60 hover:text-white",
          )}
        >
          Agent Workspace
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-1.5 text-xs text-teal-400 sm:flex">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-teal-400" />
          </span>
          Live demo
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}
