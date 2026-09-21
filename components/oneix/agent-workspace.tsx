"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { scriptsByScenario } from "@/lib/oneix/scripts"
import { caseFiles } from "@/lib/oneix/cases"
import { industries } from "@/lib/oneix/industries"
import { useLiveSession } from "@/hooks/use-live-session"
import { LIVE_WINDOW_MS } from "@/lib/oneix/live-session"
import type {
  CaseFile,
  CaseStep,
  CaseSystem,
  ChatTurn,
  SummaryPart,
} from "@/lib/oneix/types"
import {
  ArrowUp,
  Check,
  Circle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Workflow,
  BrainCircuit,
  ChevronDown,
} from "./icons"
import { ThemeToggle } from "./theme-toggle"

const SYSTEMS: CaseSystem[] = [
  "Data Warehouse",
  "CDP",
  "Marketing",
  "AI Orchestrator",
]
const AGENT_NAME = "Jordan"

const SCENARIOS = industries.flatMap((i) => i.scenarios)
const directionOf = (scenarioId: string) =>
  SCENARIOS.find((sc) => sc.id === scenarioId)?.direction ?? "inbound"

/** Demo clock: the session starts at 10:41 AM and each step/message adds a minute. */
function clock(offset: number) {
  const total = 10 * 60 + 41 + offset
  const h24 = Math.floor(total / 60) % 24
  const h12 = ((h24 + 11) % 12) + 1
  return `${h12}:${String(total % 60).padStart(2, "0")}`
}

export function AgentWorkspace() {
  const cases = Object.values(caseFiles)
  const relay = useLiveSession()
  const [selectedId, setSelectedId] = useState(cases[0].scenarioId)
  const [accepted, setAccepted] = useState<Set<string>>(new Set())
  const [tab, setTab] = useState<"ai" | "handoff">("ai")
  const [panel, setPanel] = useState<"summary" | "orchestration">("summary")
  const [seenSession, setSeenSession] = useState<string | null>(null)
  const [pinned, setPinned] = useState<{
    caseId: string
    index: number
  } | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const liveSession =
    relay.session?.status === "active" &&
    relay.ageMs !== null &&
    relay.ageMs < LIVE_WINDOW_MS
      ? relay.session
      : null
  const liveCaseId =
    liveSession && caseFiles[liveSession.scenarioId]
      ? liveSession.scenarioId
      : null
  // A new customer demo just started: jump to its ticket, fresh and unaccepted.
  if (liveSession && liveSession.sessionId !== seenSession) {
    setSeenSession(liveSession.sessionId)
    if (liveCaseId) {
      setSelectedId(liveCaseId)
      setTab("ai")
      setAccepted((prev) => {
        const next = new Set(prev)
        next.delete(liveCaseId)
        return next
      })
    }
  }

  const item = caseFiles[selectedId]
  const isAccepted = accepted.has(selectedId)
  const isLive = selectedId === liveCaseId

  const script = scriptsByScenario[selectedId]
  const handoffAt = script.findIndex((t) => t.kind === "handoff")
  const hasHandoff = handoffAt >= 0
  const direction = directionOf(selectedId)
  const notified = isLive && liveSession!.stage === "notified"
  const revealed = isLive ? liveSession!.revealed : script.length
  // Where the AI's part of the conversation ends: at the handoff, or the end
  // of the script when the AI resolves everything itself.
  const aiEnd = hasHandoff ? handoffAt : script.length
  const aiDone =
    !isLive || revealed > aiEnd || (!hasHandoff && revealed >= aiEnd)
  const before = script.slice(0, Math.min(revealed, aiEnd))
  const showAfter = hasHandoff && (isLive ? aiDone : isAccepted)
  const after = hasHandoff
    ? script.slice(handoffAt + 1, isLive ? revealed : undefined)
    : []
  const nextTurn = isLive && liveSession!.typing ? script[revealed] : undefined
  const stepsShown = aiDone
    ? item.steps.length
    : Math.max(
        Math.floor((item.steps.length * Math.min(revealed, aiEnd)) / aiEnd),
        // Outbound journeys have already fired their trigger and consent checks.
        isLive && direction === "outbound" ? 2 : 0
      )

  const statusLabel = isAccepted
    ? `Owned by ${AGENT_NAME}`
    : notified
      ? "Live · Notification sent"
      : isLive && !aiDone
        ? "Live · Ava is handling"
        : item.resolvedByAi
          ? "Resolved by AI"
          : "Awaiting agent"

  const doneSteps: CaseStep[] = item.steps.slice(0, stepsShown)
  const steps: CaseStep[] = isAccepted
    ? [
        ...doneSteps,
        { system: "CDP", label: `Handoff accepted by ${AGENT_NAME}` },
      ]
    : doneSteps
  // Live, the header follows the AI's latest step like a stepper. On a finished
  // ticket you can click any step to see which system it used.
  const pinnedIndex =
    !isLive && pinned?.caseId === selectedId ? pinned.index : null
  const activeIndex =
    steps.length === 0
      ? null
      : pinnedIndex !== null && pinnedIndex < steps.length
        ? pinnedIndex
        : steps.length - 1
  const activeSystem = activeIndex === null ? null : steps[activeIndex].system

  const listed = cases
    .filter((c) => accepted.has(c.scenarioId) === (tab === "handoff"))
    .sort(
      (a, b) =>
        Number(b.scenarioId === liveCaseId) -
        Number(a.scenarioId === liveCaseId)
    )

  useEffect(() => {
    if (isLive)
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [isLive, revealed, liveSession?.typing, selectedId, isAccepted])

  function accept() {
    setAccepted((prev) => new Set(prev).add(selectedId))
    setTab("handoff")
  }

  return (
    <div className="flex min-h-svh flex-col bg-background lg:h-svh lg:overflow-hidden">
      <WorkspaceHeader active={activeSystem} relay={relay} />

      <div className="grid min-h-0 flex-1 lg:grid-cols-[300px_minmax(0,1fr)_340px]">
        <aside className="flex min-h-0 flex-col border-b border-border bg-card lg:border-r lg:border-b-0">
          <div className="p-3">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 text-[11px] font-semibold tracking-wide uppercase">
              <TabButton active={tab === "ai"} onClick={() => setTab("ai")}>
                <Sparkles className="size-3" /> AI Queue
                <Count>{cases.length - accepted.size}</Count>
              </TabButton>
              <TabButton
                active={tab === "handoff"}
                onClick={() => setTab("handoff")}
              >
                Handoff
                <Count>{accepted.size}</Count>
              </TabButton>
            </div>
          </div>

          <div className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
            {listed.length === 0 && (
              <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                {tab === "handoff"
                  ? "Accept a handoff to see it here."
                  : "No conversations waiting."}
              </p>
            )}
            {listed.map((c) => (
              <QueueRow
                key={c.scenarioId}
                item={c}
                active={c.scenarioId === selectedId}
                live={c.scenarioId === liveCaseId}
                onClick={() => setSelectedId(c.scenarioId)}
              />
            ))}
          </div>

          <div className="grid grid-cols-3 border-t border-border py-3 text-center">
            <Stat
              value={
                cases.filter((c) => !c.resolvedByAi).length - accepted.size
              }
              label="Waiting"
              className="text-orange-500"
            />
            <Stat
              value={cases.length}
              label="AI Active"
              className="text-teal-600 dark:text-teal-400"
            />
            <Stat
              value={accepted.size}
              label="Handoff"
              className="text-rose-500"
            />
          </div>
        </aside>

        <main className="flex min-h-[520px] min-w-0 flex-col lg:min-h-0">
          <TicketHeader
            item={item}
            accepted={isAccepted}
            statusLabel={statusLabel}
            live={isLive}
            direction={direction}
          />

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-muted/30 px-4 py-5 sm:px-6">
            <div className="mx-auto max-w-xl rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-center font-mono text-[11px] text-teal-800 dark:border-teal-900/60 dark:bg-teal-950/30 dark:text-teal-300">
              {direction === "outbound"
                ? `Outbound journey · ${item.channel} · Consent checked · Ava AI assigned${notified ? " · Notification sent, waiting for the customer" : ""}`
                : `Session started · ${item.channel} · CDP context loaded · Ava AI assigned`}
            </div>

            {before.map((turn, i) => (
              <TranscriptTurn
                key={turn.id}
                turn={turn}
                time={clock(i)}
                customer={item.customer}
              />
            ))}

            {aiDone &&
              (hasHandoff ? (
                <HandoffCard
                  note={item.handoffNote}
                  accepted={isAccepted}
                  onAccept={accept}
                />
              ) : (
                <ResolvedCard note={item.handoffNote} />
              ))}

            {showAfter &&
              after.map((turn, i) => (
                <TranscriptTurn
                  key={turn.id}
                  turn={turn}
                  time={clock(before.length + 2 + i)}
                  customer={item.customer}
                />
              ))}

            {nextTurn && <TypingRow turn={nextTurn} />}
            <div ref={endRef} />
          </div>

          <div className="flex items-center gap-3 border-t border-border bg-card px-4 py-3">
            <div className="flex-1 rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground">
              {item.resolvedByAi
                ? "Resolved by AI — no reply needed"
                : isAccepted
                  ? "Type a message"
                  : "Accept the handoff to reply"}
            </div>
            <button
              disabled
              aria-label="Send"
              className="flex size-10 items-center justify-center rounded-xl bg-teal-700 text-white opacity-60"
            >
              <ArrowUp className="size-4" />
            </button>
          </div>
        </main>

        <aside className="flex min-h-0 flex-col border-t border-border bg-card lg:border-t-0 lg:border-l">
          <ProfileHeader key={item.scenarioId} item={item} />

          <div className="grid grid-cols-2 border-b border-border text-[11px] font-semibold tracking-wide uppercase">
            <PanelTab
              active={panel === "summary"}
              onClick={() => setPanel("summary")}
            >
              <Sparkles className="size-3" /> AI Summary
            </PanelTab>
            <PanelTab
              active={panel === "orchestration"}
              onClick={() => setPanel("orchestration")}
            >
              <Workflow className="size-3" /> Orchestration
            </PanelTab>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            {panel === "summary" ? (
              <SummaryPanel
                item={item}
                steps={steps}
                activeIndex={activeIndex}
                onSelectStep={
                  isLive
                    ? undefined
                    : (index) => setPinned({ caseId: selectedId, index })
                }
                summaryReady={aiDone}
                time={clock(aiEnd + 1)}
              />
            ) : (
              <OrchestrationPanel
                steps={steps}
                activeSystem={activeSystem}
                aiDone={aiDone}
              />
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

function WorkspaceHeader({
  active,
  relay,
}: {
  active: CaseSystem | null
  relay: ReturnType<typeof useLiveSession>
}) {
  return (
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-teal-900/40 bg-linear-to-r from-[#04222b] to-[#062f3a] px-4 py-3 text-white">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-teal-500 text-sm font-bold text-white">
          O
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">oneix</div>
          <div className="text-[10px] font-medium tracking-[0.18em] text-teal-300/80 uppercase">
            AI Agent Workspace
          </div>
        </div>
      </div>

      <div className="hidden items-center gap-2 md:flex">
        {SYSTEMS.map((system) => {
          const on = active === system
          return (
            <span
              key={system}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all duration-300",
                on
                  ? "border-teal-400/50 bg-teal-400/15 text-white shadow-[0_0_14px_rgba(45,212,191,0.35)]"
                  : "border-white/10 text-white/40"
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full transition-colors duration-300",
                  on ? "animate-pulse bg-teal-400" : "bg-white/25"
                )}
              />
              {system}
            </span>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <RelayStatus relay={relay} />
        <ThemeToggle />
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-full bg-orange-400 text-sm font-bold text-[#04222b]">
            {AGENT_NAME[0]}
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">{AGENT_NAME}</div>
            <div className="text-[10px] font-medium tracking-[0.18em] text-orange-300 uppercase">
              Agent
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-lg py-2 transition-colors",
        active
          ? "bg-card text-teal-700 shadow-sm dark:text-teal-300"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

function PanelTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-1.5 border-b-2 py-3 transition-colors",
        active
          ? "border-teal-600 text-teal-700 dark:text-teal-300"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

function Count({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-teal-100 px-1.5 py-px text-[10px] text-teal-700 dark:bg-teal-950 dark:text-teal-300">
      {children}
    </span>
  )
}

function Stat({
  value,
  label,
  className,
}: {
  value: number
  label: string
  className: string
}) {
  return (
    <div>
      <div className={cn("text-2xl font-bold", className)}>{value}</div>
      <div className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
        {label}
      </div>
    </div>
  )
}

function PriorityBadge({ priority }: { priority: CaseFile["priority"] }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase",
        priority === "High"
          ? "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
          : "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
      )}
    >
      {priority}
    </span>
  )
}

function QueueRow({
  item,
  active,
  live,
  onClick,
}: {
  item: CaseFile
  active: boolean
  live: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "block w-full border-l-2 px-4 py-3.5 text-left transition-colors",
        active
          ? "border-teal-500 bg-teal-50 dark:bg-teal-950/30"
          : "border-transparent hover:bg-muted/50"
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "size-2 rounded-full",
            item.priority === "High" ? "bg-rose-500" : "bg-amber-500"
          )}
        />
        <span className="flex-1 truncate text-sm font-semibold text-foreground">
          {item.customer}
        </span>
        {live ? (
          <LivePill />
        ) : (
          <span className="text-[11px] text-muted-foreground">
            {item.waiting}
          </span>
        )}
      </div>
      <p className="mt-1 truncate text-xs text-muted-foreground">
        <span className="mr-1 font-medium">
          {directionOf(item.scenarioId) === "outbound" ? "↗" : "↙"}
        </span>
        {item.subject}
      </p>
      <div className="mt-2">
        <PriorityBadge priority={item.priority} />
      </div>
    </button>
  )
}

function TicketHeader({
  item,
  accepted,
  statusLabel,
  live,
  direction,
}: {
  item: CaseFile
  accepted: boolean
  statusLabel: string
  live: boolean
  direction: "inbound" | "outbound"
}) {
  return (
    <div className="border-b border-border bg-card px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "size-2.5 rounded-full",
            item.priority === "High" ? "bg-rose-500" : "bg-amber-500"
          )}
        />
        <h2 className="text-lg font-semibold text-foreground">
          {item.customer}
        </h2>
        <span className="rounded-full border border-teal-300 bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold text-teal-700 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300">
          {item.tier}
        </span>
        <span className="flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-600 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <TriangleAlert className="size-3" /> {item.issue}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <span>
          Ticket <span className="font-mono text-foreground">#{item.id}</span>
        </span>
        <span className="font-medium text-foreground">
          {direction === "outbound" ? "↗ Outbound" : "↙ Inbound"}
        </span>
        <span>{item.channel}</span>
        <span>Started 10:41 AM</span>
        <span
          className={cn(
            "font-mono font-semibold",
            accepted ? "text-emerald-600" : "text-teal-700 dark:text-teal-300"
          )}
        >
          {statusLabel}
        </span>
        {live && <LivePill />}
      </div>
    </div>
  )
}

function HandoffCard({
  note,
  accepted,
  onAccept,
}: {
  note: string
  accepted: boolean
  onAccept: () => void
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4 rounded-2xl border px-4 py-3.5",
        accepted
          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/30"
          : "border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/30"
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          accepted
            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950"
            : "bg-rose-100 text-rose-500 dark:bg-rose-950"
        )}
      >
        {accepted ? (
          <Check className="size-5" strokeWidth={3} />
        ) : (
          <RefreshCw className="size-5" />
        )}
      </div>
      <div className="min-w-0 flex-1 basis-56">
        <div className="text-sm font-semibold text-foreground">
          {accepted ? `Handoff accepted by ${AGENT_NAME}` : "AI Handoff"}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>
      </div>
      {!accepted && (
        <button
          onClick={onAccept}
          className="rounded-lg bg-rose-600 px-5 py-2 text-xs font-bold tracking-wider text-white uppercase transition-colors hover:bg-rose-700"
        >
          Accept
        </button>
      )}
    </div>
  )
}

function SummaryPanel({
  item,
  steps,
  activeIndex,
  onSelectStep,
  summaryReady,
  time,
}: {
  item: CaseFile
  steps: CaseStep[]
  activeIndex: number | null
  onSelectStep?: (index: number) => void
  summaryReady: boolean
  time: string
}) {
  return (
    <>
      <section className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4 dark:border-teal-900/60 dark:bg-teal-950/20">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-teal-700 uppercase dark:text-teal-300">
            <Sparkles className="size-3.5" /> AI Summary
          </h3>
          <span className="font-mono text-[10px] text-muted-foreground">
            {time} AM
          </span>
        </div>
        {summaryReady ? (
          <p className="text-[13px] leading-relaxed text-foreground">
            {item.summary.map((part, i) => (
              <SummaryText key={i} part={part} />
            ))}
          </p>
        ) : (
          <p className="text-[13px] leading-relaxed text-muted-foreground italic">
            Ava is still handling this conversation. The summary is written at
            handoff.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-muted/40 p-4">
        <h3 className="mb-3 text-xs font-bold tracking-wider text-muted-foreground uppercase">
          AI Actions Taken
        </h3>
        {steps.length === 0 && (
          <p className="text-[13px] text-muted-foreground italic">
            Waiting for the first action…
          </p>
        )}
        <ul className="space-y-1">
          {steps.map((step, i) => {
            const active = i === activeIndex
            const Row = onSelectStep ? "button" : "div"
            return (
              <li key={step.label}>
                <Row
                  {...(onSelectStep
                    ? {
                        onClick: () => onSelectStep(i),
                        type: "button" as const,
                      }
                    : {})}
                  className={cn(
                    "flex w-full items-start justify-between gap-3 rounded-lg px-2 py-1.5 text-left text-[13px] text-foreground transition-colors",
                    active && "bg-teal-500/10 ring-1 ring-teal-500/30",
                    onSelectStep && !active && "hover:bg-muted"
                  )}
                >
                  <span>
                    {step.label}
                    <span
                      className={cn(
                        "mt-0.5 block font-mono text-[10px] tracking-wide uppercase",
                        active
                          ? "text-teal-600 dark:text-teal-300"
                          : "text-muted-foreground"
                      )}
                    >
                      {step.system}
                    </span>
                  </span>
                  <span className="shrink-0 pt-0.5 font-mono text-[10px] text-muted-foreground">
                    {clock(i)}
                  </span>
                </Row>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold tracking-wider text-amber-700 uppercase dark:text-amber-300">
          <Sparkles className="size-3.5" /> AI Agent Recommendations
        </h3>
        <ol className="space-y-2">
          {item.recommendation.map((rec, i) => (
            <li key={rec} className="flex gap-2 text-[13px] text-foreground">
              <span className="font-semibold text-amber-600 dark:text-amber-300">
                {i + 1}.
              </span>
              {rec}
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}

function SummaryText({ part }: { part: SummaryPart }) {
  if (typeof part === "string") return <>{part}</>
  return (
    <strong
      className={cn(
        "font-semibold",
        part.tone === "danger"
          ? "text-rose-600 dark:text-rose-400"
          : "text-orange-500 dark:text-orange-400"
      )}
    >
      {part.text}
    </strong>
  )
}

/** The customer at a glance, pinned above the sidebar tabs. */
function ProfileHeader({ item }: { item: CaseFile }) {
  const [open, setOpen] = useState(false)
  // The name and tier are already shown above; skip rows that just repeat it.
  const rows = item.profile.filter((r) => r.value !== item.customer)
  const shown = open ? rows : rows.slice(0, 4)
  const initials = item.customer
    .split(" ")
    .filter((w) => /^[A-Z]/.test(w) && w !== "Madam")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")

  return (
    <div className="shrink-0 border-b border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-teal-700 to-teal-400 text-sm font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">
            {item.customer}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {item.tier}
          </div>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
        {shown.map((row) => (
          <div key={row.label} className="min-w-0">
            <dt className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
              {row.label}
            </dt>
            <dd className="text-xs leading-snug text-foreground">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      {rows.length > 4 && (
        <button
          onClick={() => setOpen((o) => !o)}
          className="mt-2.5 flex items-center gap-1 text-[11px] font-semibold text-teal-700 dark:text-teal-300"
        >
          {open ? "Show less" : `Show all (${rows.length})`}
          <ChevronDown
            className={cn("size-3 transition-transform", open && "rotate-180")}
          />
        </button>
      )}
    </div>
  )
}

const SYSTEM_INFO: Record<
  CaseSystem,
  { subtitle: string; node: string; card: string; title: string }
> = {
  "Data Warehouse": {
    subtitle: "Enterprise data foundation",
    node: "bg-teal-600 text-white",
    card: "border-teal-200 bg-teal-50/60 dark:border-teal-900/60 dark:bg-teal-950/20",
    title: "text-teal-700 dark:text-teal-300",
  },
  CDP: {
    subtitle: "Customer data & full context",
    node: "bg-[#0a3a4a] text-white",
    card: "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40",
    title: "text-[#0a3a4a] dark:text-slate-200",
  },
  Marketing: {
    subtitle: "Segmentation & journey orchestration",
    node: "bg-orange-500 text-white",
    card: "border-orange-200 bg-orange-50/60 dark:border-orange-900/60 dark:bg-orange-950/20",
    title: "text-orange-600 dark:text-orange-300",
  },
  "AI Orchestrator": {
    subtitle: "GenAI · Agentic AI · LLM reasoning",
    node: "bg-rose-500 text-white",
    card: "border-rose-200 bg-rose-50/60 dark:border-rose-900/60 dark:bg-rose-950/20",
    title: "text-rose-600 dark:text-rose-300",
  },
}

/**
 * A vertical stepper of the four technologies. Each card shows what that
 * technology has done in this interaction so far (from the tagged steps), the
 * one working right now is marked ACTIVE, and ones that haven't been needed
 * stay hollow.
 */
function OrchestrationPanel({
  steps,
  activeSystem,
  aiDone,
}: {
  steps: CaseStep[]
  activeSystem: CaseSystem | null
  aiDone: boolean
}) {
  return (
    <>
      <section className="rounded-2xl bg-linear-to-br from-[#04222b] to-[#0a3a4a] p-4 text-white">
        <h3 className="text-xs font-bold tracking-[0.18em] text-teal-300 uppercase">
          Orchestration
        </h3>
        <p className="mt-1.5 text-[13px] leading-snug text-white/80">
          Track how each technology contributes to this interaction in
          real-time.
        </p>
      </section>

      <ol>
        {SYSTEMS.map((system, i) => {
          const info = SYSTEM_INFO[system]
          const used = steps.filter((s) => s.system === system)
          const active = system === activeSystem
          const done = !active && used.length > 0
          const recent = used.slice(-2)
          const last = i === SYSTEMS.length - 1

          return (
            <li key={system} className="relative flex gap-3 pb-3">
              {!last && (
                <span
                  className={cn(
                    "absolute top-8 -bottom-0 left-4 w-px -translate-x-1/2",
                    done || active ? "bg-teal-500/50" : "bg-border"
                  )}
                />
              )}
              <span
                className={cn(
                  "relative z-10 mt-2 flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                  active || done
                    ? info.node
                    : "border-2 border-border bg-card text-muted-foreground",
                  active && "ring-4 ring-rose-400/25"
                )}
              >
                {active ? (
                  <BrainCircuit className="size-4 animate-pulse" />
                ) : done ? (
                  <Check className="size-4" strokeWidth={3} />
                ) : (
                  <Circle className="size-3 opacity-40" />
                )}
              </span>

              <div
                className={cn(
                  "min-w-0 flex-1 rounded-xl border p-3 transition-colors duration-300",
                  active || done ? info.card : "border-border bg-muted/30"
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-bold",
                      active || done ? info.title : "text-muted-foreground"
                    )}
                  >
                    {system}
                  </span>
                  {active && (
                    <span className="flex items-center gap-1 rounded-full border border-rose-300 bg-rose-100 px-1.5 py-px text-[9px] font-bold tracking-wider text-rose-600 uppercase dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300">
                      <span className="size-1.5 animate-pulse rounded-full bg-rose-500" />
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{info.subtitle}</p>

                {recent.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {recent.map((s) => (
                      <li
                        key={s.label}
                        className="text-[13px] leading-snug text-foreground"
                      >
                        {s.label}
                      </li>
                    ))}
                    {used.length > recent.length && (
                      <li className="text-[11px] text-muted-foreground">
                        +{used.length - recent.length} earlier
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground italic">
                    {aiDone ? "Not needed for this interaction" : "Waiting…"}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </>
  )
}

function AiLabel({ time }: { time: string }) {
  return (
    <div className="mb-1 flex items-center gap-1.5 text-xs">
      <Sparkles className="size-3 text-teal-600 dark:text-teal-400" />
      <span className="font-semibold text-teal-700 dark:text-teal-300">
        Ava AI
      </span>
      <span className="font-mono text-[10px] text-muted-foreground">
        {time} AM
      </span>
    </div>
  )
}

function TranscriptTurn({
  turn,
  time,
  customer,
}: {
  turn: ChatTurn
  time: string
  customer: string
}) {
  switch (turn.kind) {
    case "message": {
      const live = turn.from === "agent"
      return (
        <div className="max-w-[85%]">
          {live ? (
            <div className="mb-1 flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                {turn.speaker}
              </span>
              <span className="text-muted-foreground">Live Agent</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {time} AM
              </span>
            </div>
          ) : (
            <AiLabel time={time} />
          )}
          <div
            className={cn(
              "rounded-2xl rounded-tl-md border px-4 py-3 text-sm leading-relaxed whitespace-pre-line text-foreground",
              live
                ? "border-indigo-200 bg-indigo-50 dark:border-indigo-900/60 dark:bg-indigo-950/30"
                : "border-teal-200 bg-teal-50 dark:border-teal-900/60 dark:bg-teal-950/30"
            )}
          >
            {turn.text}
          </div>
        </div>
      )
    }
    case "checklist":
      return (
        <div className="max-w-[85%]">
          <AiLabel time={time} />
          <div className="space-y-2 rounded-2xl rounded-tl-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-foreground dark:border-teal-900/60 dark:bg-teal-950/30">
            {turn.intro && <p className="whitespace-pre-line">{turn.intro}</p>}
            <ul className="space-y-1">
              {turn.items.map((it) => (
                <li key={it} className="flex items-start gap-1.5">
                  <Check
                    className="mt-0.5 size-3.5 shrink-0 text-teal-600"
                    strokeWidth={3}
                  />{" "}
                  {it}
                </li>
              ))}
              {turn.pending?.map((it) => (
                <li
                  key={it}
                  className="flex items-start gap-1.5 text-muted-foreground"
                >
                  <Circle className="mt-0.5 size-3.5 shrink-0 opacity-50" />{" "}
                  {it}
                </li>
              ))}
            </ul>
            {turn.outro && <p>{turn.outro}</p>}
          </div>
        </div>
      )
    case "reply":
      return (
        <div className="flex flex-col items-end">
          <div className="mb-1 flex items-center gap-1.5 text-xs">
            <span className="font-mono text-[10px] text-muted-foreground">
              {time} AM
            </span>
            <span className="font-semibold text-foreground">
              {customer.split(" ")[0]}
            </span>
          </div>
          <div className="flex items-end gap-2">
            <div className="max-w-[26rem] rounded-2xl rounded-br-md bg-[#0a3a4a] px-4 py-3 text-sm leading-relaxed text-white">
              {turn.text}
            </div>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0a3a4a] text-[10px] font-bold text-white">
              {customer
                .split(" ")
                .map((w) => w[0])
                .slice(-2)
                .join("")}
            </div>
          </div>
        </div>
      )
    case "system":
    case "faceid":
      return (
        <div className="flex items-center justify-center gap-1.5 text-center font-mono text-[11px] text-muted-foreground">
          {turn.kind === "faceid" && (
            <ShieldCheck className="size-3.5 text-teal-600" />
          )}
          {turn.text}
        </div>
      )
    case "alert":
      return (
        <div className="mx-auto max-w-sm rounded-xl border border-border bg-card px-4 py-2.5 text-center">
          <div className="text-[10px] font-bold tracking-wider text-rose-600 uppercase dark:text-rose-400">
            {turn.title}
          </div>
          {turn.lines.map((l) => (
            <div key={l} className="text-xs text-muted-foreground">
              {l}
            </div>
          ))}
        </div>
      )
    case "status":
    case "payment":
    case "options":
    case "transactions":
      return <InfoCard turn={turn} />
    default:
      return null
  }
}

/** Structured cards from the conversation, shown compactly for the agent. */
function InfoCard({
  turn,
}: {
  turn: Extract<
    ChatTurn,
    { kind: "status" | "payment" | "options" | "transactions" }
  >
}) {
  return (
    <div className="max-w-[85%] rounded-xl border border-border bg-card px-4 py-3 text-xs">
      {turn.kind === "status" && (
        <>
          <div className="mb-2 font-semibold text-foreground">{turn.title}</div>
          {turn.rows.map((r) => (
            <div key={r.label} className="flex justify-between gap-4 py-0.5">
              <span className="text-muted-foreground">{r.label}</span>
              <span
                className={cn(
                  "font-medium",
                  r.positive ? "text-emerald-600" : "text-foreground"
                )}
              >
                {r.value}
              </span>
            </div>
          ))}
        </>
      )}
      {turn.kind === "payment" && (
        <>
          <div className="mb-2 font-semibold text-foreground">{turn.title}</div>
          {turn.rows.map((r) => (
            <div key={r.label} className="flex justify-between py-0.5">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-medium text-foreground">{r.amount}</span>
            </div>
          ))}
          <div className="mt-1 flex justify-between border-t border-border pt-1 font-semibold text-foreground">
            <span>Total</span>
            <span>{turn.total}</span>
          </div>
        </>
      )}
      {turn.kind === "options" && (
        <>
          {turn.intro && (
            <div className="mb-2 text-foreground">{turn.intro}</div>
          )}
          {turn.options.map((o) => (
            <div key={o.id} className="py-1">
              <div className="font-semibold text-foreground">{o.heading}</div>
              <div className="text-muted-foreground">{o.lines.join(" · ")}</div>
            </div>
          ))}
        </>
      )}
      {turn.kind === "transactions" &&
        turn.items.map((t) => (
          <div key={t.id} className="flex justify-between gap-4 py-0.5">
            <span className="text-foreground">
              {t.label}{" "}
              <span className="text-muted-foreground">· {t.time}</span>
            </span>
            <span className="font-medium text-foreground">{t.amount}</span>
          </div>
        ))}
    </div>
  )
}

function LivePill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">
      <span className="size-1.5 animate-pulse rounded-full bg-white" />
      Live
    </span>
  )
}

function TypingRow({ turn }: { turn: ChatTurn }) {
  const isText = turn.kind === "message" || turn.kind === "checklist"
  if (!isText) {
    return (
      <div className="text-center font-mono text-[11px] text-muted-foreground">
        Processing…
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span
        className={cn(
          "font-semibold",
          turn.from === "agent"
            ? "text-indigo-700 dark:text-indigo-300"
            : "text-teal-700 dark:text-teal-300"
        )}
      >
        {turn.speaker}
      </span>
      is typing
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-bounce rounded-full bg-muted-foreground/50"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </span>
    </div>
  )
}

/** Header indicator so booth staff can tell at a glance whether sync is working. */
function RelayStatus({ relay }: { relay: ReturnType<typeof useLiveSession> }) {
  const unconfigured =
    relay.store === "memory" && process.env.NODE_ENV === "production"
  const label = !relay.online
    ? "Sync offline"
    : unconfigured
      ? "Sync not configured"
      : "Live sync"
  const tone = !relay.online || unconfigured ? "bg-amber-400" : "bg-emerald-400"
  return (
    <div
      className="hidden items-center gap-1.5 text-[11px] text-white/70 sm:flex"
      title={
        unconfigured
          ? "Add an Upstash Redis integration on Vercel so separate devices can sync."
          : undefined
      }
    >
      <span className={cn("size-1.5 rounded-full", tone)} />
      {label}
      <span className="font-mono text-white/40">· {relay.room}</span>
    </div>
  )
}

function ResolvedCard({ note }: { note: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 dark:border-emerald-900/60 dark:bg-emerald-950/30">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950">
        <Check className="size-5" strokeWidth={3} />
      </div>
      <div>
        <div className="text-sm font-semibold text-foreground">
          Resolved by AI
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>
      </div>
    </div>
  )
}
