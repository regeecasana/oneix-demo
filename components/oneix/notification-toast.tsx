"use client"

import { Bell } from "./icons"

export function NotificationToast({
  sender,
  body,
  onReview,
  onDismiss,
}: {
  sender: string
  body: string
  onReview: () => void
  onDismiss: () => void
}) {
  return (
    <div className="fixed right-4 bottom-4 z-50 w-[min(340px,calc(100vw-2rem))] rounded-2xl border border-border bg-card p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-500/15 text-teal-600">
          <Bell className="size-4" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold text-foreground">{sender}</div>
          <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={onReview}
              className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-700"
            >
              Review options
            </button>
            <button
              onClick={onDismiss}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
