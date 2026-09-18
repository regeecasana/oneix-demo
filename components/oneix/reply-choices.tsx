"use client"

import { cn } from "@/lib/utils"

/**
 * Renders a reply turn's `choices` as a stack of buttons instead of the usual
 * single chip — e.g. "Keep delayed flight" / "Move me to 7:05 AM" / "Show
 * other options". Only the `correct` choice is clickable; the others are
 * shown disabled, since this demo only has one scripted path. Clicking the
 * correct one sends the turn's actual `text` (which may read differently
 * from the button label, matching natural dialogue).
 */
export function ReplyChoices({
  choices,
  activeClassName,
  onSelect,
}: {
  choices: { label: string; correct?: boolean }[]
  activeClassName: string
  onSelect: () => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {choices.map((choice, i) => (
        <button
          key={i}
          disabled={!choice.correct}
          onClick={choice.correct ? onSelect : undefined}
          className={cn(
            "rounded-xl border px-3 py-2 text-left text-sm transition-colors",
            choice.correct ? activeClassName : "cursor-not-allowed border-border text-muted-foreground/40",
          )}
        >
          {choice.label}
        </button>
      ))}
    </div>
  )
}
