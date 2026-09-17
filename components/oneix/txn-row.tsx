"use client"

import { cn } from "@/lib/utils"
import type { TxnVerdict } from "@/lib/oneix/types"

/**
 * One flagged transaction with its own classify buttons. The script defines a
 * `correctVerdict` per item — there's exactly one right answer for this demo's
 * narrative, so the other button is disabled from the start rather than letting
 * the presenter pick a path the following AI line wouldn't match. Once the
 * correct side is picked, the row locks: it stays highlighted, both buttons
 * become inert.
 */
export function TxnRow({
  item,
  verdict,
  onClassify,
}: {
  item: { id: string; label: string; amount: string; time: string; correctVerdict: TxnVerdict }
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
        <TxnButton
          label="This was me"
          isCorrect={item.correctVerdict === "mine"}
          selected={verdict === "mine"}
          locked={locked}
          activeClass="border-emerald-400 bg-emerald-100 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          idleClass="border-border text-muted-foreground hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30"
          onClick={() => onClassify("mine")}
        />
        <TxnButton
          label="It wasn't me"
          isCorrect={item.correctVerdict === "unknown"}
          selected={verdict === "unknown"}
          locked={locked}
          activeClass="border-red-400 bg-red-100 text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
          idleClass="border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
          onClick={() => onClassify("unknown")}
        />
      </div>
    </div>
  )
}

function TxnButton({
  label,
  isCorrect,
  selected,
  locked,
  activeClass,
  idleClass,
  onClick,
}: {
  label: string
  isCorrect: boolean
  selected: boolean
  locked: boolean
  activeClass: string
  idleClass: string
  onClick: () => void
}) {
  return (
    <button
      disabled={!isCorrect || locked}
      onClick={onClick}
      className={cn(
        "flex-1 rounded-md border py-1.5 text-xs font-medium transition-colors",
        selected ? activeClass : !isCorrect ? "cursor-not-allowed border-border text-muted-foreground/40" : idleClass,
      )}
    >
      {label}
    </button>
  )
}
