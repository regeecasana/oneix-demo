"use client"

import { cn } from "@/lib/utils"
import type { TxnVerdict } from "@/lib/oneix/types"

/**
 * One flagged transaction with its own classify buttons — the presenter picks
 * "This was me" / "It wasn't me" per row, in whichever order. Once a row has a
 * verdict it's locked: the chosen side stays highlighted, the other is disabled
 * rather than swapped out, so the row keeps showing what was picked.
 */
export function TxnRow({
  item,
  verdict,
  onClassify,
}: {
  item: { id: string; label: string; amount: string; time: string }
  verdict: TxnVerdict | undefined
  onClassify: (verdict: TxnVerdict) => void
}) {
  const locked = !!verdict

  return (
    <div className="rounded-lg border border-border bg-card p-2.5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-foreground">{item.label}</div>
          <div className="text-xs text-muted-foreground">{item.time}</div>
        </div>
        <div className="text-sm font-semibold text-foreground">{item.amount}</div>
      </div>
      <div className="mt-2 flex gap-2">
        <button
          disabled={locked}
          onClick={() => onClassify("mine")}
          className={cn(
            "flex-1 rounded-md border py-1.5 text-xs font-medium transition-colors",
            verdict === "mine"
              ? "border-emerald-400 bg-emerald-100 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              : locked
                ? "cursor-not-allowed border-border text-muted-foreground/40"
                : "border-border text-muted-foreground hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30",
          )}
        >
          This was me
        </button>
        <button
          disabled={locked}
          onClick={() => onClassify("unknown")}
          className={cn(
            "flex-1 rounded-md border py-1.5 text-xs font-medium transition-colors",
            verdict === "unknown"
              ? "border-red-400 bg-red-100 text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
              : locked
                ? "cursor-not-allowed border-border text-muted-foreground/40"
                : "border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30",
          )}
        >
          It wasn&apos;t me
        </button>
      </div>
    </div>
  )
}
