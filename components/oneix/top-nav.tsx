"use client"

import { ThemeToggle } from "./theme-toggle"

export function TopNav() {
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

      <div className="flex items-center gap-3">
        <ThemeToggle />
      </div>
    </header>
  )
}
