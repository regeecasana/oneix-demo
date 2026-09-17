"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { caseFiles, scriptsByScenario } from "@/lib/oneix/scripts"
import { Check, ArrowRight } from "./icons"

const queue = [
  {
    scenarioId: "fraud",
    priority: "High",
    channel: "Chat handoff",
    waiting: "0m 12s",
  },
  {
    scenarioId: "collections",
    priority: "Standard",
    channel: "Chat handoff",
    waiting: "0m 04s",
  },
]

export function AgentWorkspace() {
  const [selected, setSelected] = useState<string>(queue[0].scenarioId)
  const item = caseFiles[selected]
  const transcript = scriptsByScenario[selected].filter(
    (t) => t.kind === "message" || t.kind === "reply" || t.kind === "checklist",
  )

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-8 lg:grid-cols-[280px_1fr_320px]">
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Incoming queue
        </div>
        <div className="divide-y divide-border">
          {queue.map((q) => {
            const c = caseFiles[q.scenarioId]
            const active = q.scenarioId === selected
            return (
              <button
                key={q.scenarioId}
                onClick={() => setSelected(q.scenarioId)}
                className={cn(
                  "w-full px-4 py-3 text-left transition-colors",
                  active ? "bg-teal-50 dark:bg-teal-950/30" : "hover:bg-muted/50",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{c.customer}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase",
                      q.priority === "High"
                        ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                    )}
                  >
                    {q.priority}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">{c.id}</div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{q.channel}</span>
                  <span>waiting {q.waiting}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-foreground">{item.customer}</div>
            <div className="text-xs text-muted-foreground">{item.authNote}</div>
          </div>
          <span className="rounded-full bg-teal-100 px-2 py-1 text-[10px] font-semibold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
            Handed off from Ava
          </span>
        </div>

        <Section title="Intent">
          <p className="text-sm text-foreground">{item.intent}</p>
        </Section>

        <Section title="Customer-confirmed facts">
          <ul className="space-y-1.5">
            {item.facts.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <Check className="mt-0.5 size-3.5 shrink-0 text-teal-600" strokeWidth={3} />
                {f}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Actions already completed">
          <ul className="space-y-1.5">
            {item.actionsCompleted.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <Check className="mt-0.5 size-3.5 shrink-0 text-teal-600" strokeWidth={3} />
                {f}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Reason for escalation">
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
            {item.reason}
          </p>
        </Section>

        <div className="mt-2 rounded-lg border border-dashed border-border px-3 py-2 text-center text-[11px] text-muted-foreground">
          Do not ask the customer to repeat the information above.
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            AI recommendation
          </div>
          <ul className="space-y-2">
            {item.recommendation.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                <ArrowRight className="mt-0.5 size-3 shrink-0 text-teal-600" />
                {r}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex-1 rounded-xl border border-border bg-card p-4">
          <div className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            AI conversation transcript
          </div>
          <div className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
            {transcript.map((t, i) =>
              t.kind === "message" ? (
                <div key={i} className="text-xs">
                  <span className="font-medium text-foreground">{t.speaker}: </span>
                  <span className="text-muted-foreground">{t.text}</span>
                </div>
              ) : t.kind === "reply" ? (
                <div key={i} className="text-xs">
                  <span className="font-medium text-foreground">{item.customer.split(" ")[0]}: </span>
                  <span className="text-muted-foreground">{t.text}</span>
                </div>
              ) : t.kind === "checklist" ? (
                <div key={i} className="text-xs">
                  <span className="font-medium text-foreground">{t.speaker}: </span>
                  <span className="text-muted-foreground">{t.items.join(" · ")}</span>
                </div>
              ) : null,
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</div>
      {children}
    </div>
  )
}
