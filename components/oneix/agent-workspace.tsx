"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { scriptsByScenario } from "@/lib/oneix/scripts"
import { caseFiles } from "@/lib/oneix/cases"
import { industries } from "@/lib/oneix/industries"
import { useLiveSession } from "@/hooks/use-live-session"
import { useLiveChat } from "@/hooks/use-live-chat"
import { LIVE_WINDOW_MS } from "@/lib/oneix/live-session"
import { AGENT_NAME, type LiveMessage } from "@/lib/oneix/live-chat"
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
  ChevronDown,
  Zap,
  Eye,
} from "./icons"
import { ThemeToggle } from "./theme-toggle"

const SYSTEMS: CaseSystem[] = [
  "Data Warehouse",
  "CDP",
  "Marketing",
  "AI Orchestrator",
]

const SCENARIOS = industries.flatMap((i) => i.scenarios)
const directionOf = (scenarioId: string) =>
  SCENARIOS.find((sc) => sc.id === scenarioId)?.direction ?? "inbound"

/** The last spoken line of a scenario's script, so the queue reads like a
 * real inbox ("here's how it ended") instead of a static subject line. */
function lastMessageOf(script: ChatTurn[]): string {
  for (let i = script.length - 1; i >= 0; i--) {
    const turn = script[i]
    if (turn.kind === "message" || turn.kind === "reply") return turn.text
  }
  return ""
}
const LAST_MESSAGE: Record<string, string> = Object.fromEntries(
  Object.entries(scriptsByScenario).map(([id, script]) => [
    id,
    lastMessageOf(script),
  ])
)

/** Flattens a scripted turn into a plain chat-completion line for the
 * co-pilot's context, where it exists -- structured cards (transactions,
 * payment, etc.) aren't worth translating to text and are just skipped. */
function scriptTurnToLine(
  turn: ChatTurn
): { role: "assistant" | "user"; text: string }[] {
  const assistant = (text: string) => [{ role: "assistant" as const, text }]
  switch (turn.kind) {
    case "message":
      return assistant(turn.text)
    case "reply":
      return [{ role: "user", text: turn.text }]
    case "checklist": {
      const text = [turn.intro, ...turn.items, turn.outro]
        .filter(Boolean)
        .join(" ")
      return text ? assistant(text) : []
    }
    case "alert":
      return assistant(`[System alert] ${turn.title}: ${turn.lines.join("; ")}`)
    case "system":
      return assistant(`[System] ${turn.text}`)
    case "faceid":
      return assistant(`[System] ${turn.text}`)
    case "handoff":
      return assistant(`[System] Handed off to ${turn.to} (${turn.role}).`)
    case "options": {
      const options = turn.options
        .map((o) => `${o.heading} — ${o.lines.join(", ")}`)
        .join(" | ")
      const text = [turn.intro, options, turn.outro].filter(Boolean).join(" ")
      return assistant(text)
    }
    case "transactions": {
      const items = turn.items
        .map((t) => `${t.label} ${t.amount} (${t.time})`)
        .join("; ")
      return assistant(`[System] Flagged transactions: ${items}`)
    }
    case "payment": {
      const rows = turn.rows.map((r) => `${r.label}: ${r.amount}`).join(", ")
      return assistant(
        `[System] ${turn.title} (source: ${turn.source}) — ${rows}. Total: ${turn.total}`
      )
    }
    case "status": {
      const rows = turn.rows.map((r) => `${r.label}: ${r.value}`).join(", ")
      return assistant(`[System] ${turn.title} — ${rows}`)
    }
  }
}

/** Demo clock: anchored to the real time the page was opened (not a
 * hardcoded hour) so times look current, not frozen at the same fake moment
 * every run. `anchor` comes from client-only state (see AgentWorkspace) so
 * this never runs during SSR, where "now" would mean the server's clock. */
function clock(anchor: number | null, offset: number): string {
  if (anchor === null) return "--:--"
  const d = new Date(anchor + offset * 60_000)
  const h24 = d.getHours()
  const h12 = ((h24 + 11) % 12) + 1
  const mm = String(d.getMinutes()).padStart(2, "0")
  return `${h12}:${mm} ${h24 >= 12 ? "PM" : "AM"}`
}

export function AgentWorkspace() {
  const cases = Object.values(caseFiles)
  const relay = useLiveSession()
  // Nothing is selected until a booth operator actually clicks a ticket --
  // including a live one, which is only ever highlighted, never auto-opened.
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [accepted, setAccepted] = useState<Set<string>>(new Set())
  const [tab, setTab] = useState<"ai" | "handoff">("ai")
  const [panel, setPanel] = useState<"summary" | "orchestration">("summary")
  const [seenSession, setSeenSession] = useState<string | null>(null)
  const [pinned, setPinned] = useState<{
    caseId: string
    index: number
  } | null>(null)
  const [draft, setDraft] = useState("")
  // The AI-drafted reply awaiting the agent's approval or edit -- shown as
  // its own card (Approve & Send / Edit), not silently dropped into the
  // composer. Cleared the moment the agent approves it, edits it, or types
  // something of their own instead.
  const [suggestion, setSuggestion] = useState<string | null>(null)
  // Whether a suggestion request is in flight, for the "Generating…" card.
  const [suggesting, setSuggesting] = useState(false)
  // How many customer messages we've already requested a suggestion for --
  // a ref (not state) so the effect below can dedupe without retriggering
  // itself.
  const suggestedForRef = useRef(-1)
  const endRef = useRef<HTMLDivElement>(null)
  // Anchors the demo clock to the real moment the page opened, client-side
  // only -- set post-mount (not a useState initializer) so SSR and the first
  // client render agree on "--:--" and there's no hydration mismatch.
  const [sessionStart, setSessionStart] = useState<number | null>(null)
  useEffect(() => {
    setSessionStart(Date.now())
  }, [])

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
  // A new customer demo just started: mark its ticket fresh and unaccepted --
  // it's highlighted as live in the queue, but left for the operator to open.
  if (liveSession && liveSession.sessionId !== seenSession) {
    setSeenSession(liveSession.sessionId)
    if (liveCaseId) {
      setAccepted((prev) => {
        const next = new Set(prev)
        next.delete(liveCaseId)
        return next
      })
    }
  }

  // A safe stand-in for all the derived reads below when nothing is selected
  // yet -- selectedId itself stays null so no ticket looks opened until the
  // operator actually clicks one, and none of this (including the live-chat
  // poll below) fires for a session nothing is actually showing.
  const displayId = selectedId ?? cases[0].scenarioId
  const item = caseFiles[displayId]
  const isAccepted = accepted.has(displayId)
  const isLive = displayId === liveCaseId

  // A human agent can take a live conversation over from Adam at any point --
  // via Accept once the scripted handoff is reached, or Takeover mid-AI. Once
  // taken, it becomes a real two-way exchange instead of the scripted lines.
  const chat = useLiveChat(isLive ? liveSession!.sessionId : null)
  const liveHandoffActive = isLive && chat.owner === "agent"

  const script = scriptsByScenario[displayId]
  const handoffAt = script.findIndex((t) => t.kind === "handoff")
  const hasHandoff = handoffAt >= 0
  const customerMessageCount = chat.messages.filter(
    (m) => m.from === "customer"
  ).length
  const direction = directionOf(displayId)
  const notified = isLive && liveSession!.stage === "notified"
  // Live, progress comes from the customer's actual session. A static
  // (non-live) ticket just shows the whole thing at once -- reviewing an old
  // ticket shouldn't play out turn by turn.
  const revealed = isLive ? liveSession!.revealed : script.length
  // Where the AI's part of the conversation ends: at the handoff, or the end
  // of the script when the AI resolves everything itself.
  const aiEnd = hasHandoff ? handoffAt : script.length
  const aiDone = revealed > aiEnd || (!hasHandoff && revealed >= aiEnd)
  const before = script.slice(0, Math.min(revealed, aiEnd))
  const showAfter = hasHandoff && aiDone
  const after = hasHandoff ? script.slice(handoffAt + 1, revealed) : []
  const nextTurn = isLive && liveSession!.typing ? script[revealed] : undefined
  // What the co-pilot gets to work with: Adam's real conversation with this
  // customer, followed by the live exchange since the takeover -- not the
  // scenario's canned continuation, since that's no longer what's happening.
  const suggestTranscript = [
    ...before.flatMap((turn) => scriptTurnToLine(turn)),
    ...chat.messages.map((m) => ({
      role: m.from === "agent" ? ("assistant" as const) : ("user" as const),
      text: m.text,
    })),
  ]
  const stepsShown = aiDone
    ? item.steps.length
    : Math.max(
        Math.floor((item.steps.length * Math.min(revealed, aiEnd)) / aiEnd),
        // Outbound journeys have already fired their trigger and consent checks.
        isLive && direction === "outbound" ? 2 : 0
      )

  const statusLabel = liveHandoffActive
    ? `Live · You're chatting`
    : isAccepted
      ? `Owned by ${AGENT_NAME}`
      : notified
        ? "Live · Notification sent"
        : isLive && !aiDone
          ? "Live · Adam is handling"
          : item.resolvedByAi
            ? "Resolved by AI"
            : "Awaiting agent"

  const doneSteps: CaseStep[] = item.steps.slice(0, stepsShown)
  const steps: CaseStep[] = isAccepted
    ? [
        ...doneSteps,
        { system: "CDP", label: `${AGENT_NAME} took over the conversation` },
      ]
    : doneSteps
  // A finished (static) ticket already happened, so its timestamps read
  // backward from "now" -- the last message is the most recent, earlier ones
  // further in the past. A live ticket has no fixed "last turn" yet while
  // it's still unfolding, so it keeps counting forward from when the page
  // opened instead.
  const lastTurnDisplayIndex =
    showAfter && after.length > 0
      ? before.length + 2 + after.length - 1
      : before.length - 1
  function turnTime(displayIndex: number) {
    return isLive
      ? clock(sessionStart, displayIndex)
      : clock(sessionStart, displayIndex - lastTurnDisplayIndex)
  }
  function stepTime(stepIndex: number) {
    return isLive
      ? clock(sessionStart, stepIndex)
      : clock(sessionStart, stepIndex - (steps.length - 1))
  }
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
  // Steps the AI has reached so far. A technology counts as "used" once one of
  // these relies on it, so the header and the Orchestration panel always agree.
  const reachedSteps =
    activeIndex === null ? [] : steps.slice(0, activeIndex + 1)

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
  }, [
    isLive,
    revealed,
    liveSession?.typing,
    selectedId,
    isAccepted,
    chat.messages.length,
  ])

  // Co-pilot: once live, ask the model for a suggested reply -- right after
  // takeover, and again each time the customer sends something new -- and
  // show it as its own Approve/Edit card. Skips only once the agent has
  // actually started typing their own reply (draft is exclusively that now,
  // never auto-filled) -- a stale, still-unapproved suggestion card gets
  // overwritten by the fresh one. Also only once per customer message (the
  // ref), so it doesn't re-fire on every render while the request is in
  // flight.
  useEffect(() => {
    if (!liveHandoffActive || draft.trim()) return
    if (suggestedForRef.current === customerMessageCount) return
    suggestedForRef.current = customerMessageCount
    let cancelled = false
    setSuggesting(true)
    fetch("/api/suggest-reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: item.customer,
        issue: item.issue,
        tier: item.tier,
        transcript: suggestTranscript,
        // Jordan hasn't sent anything yet this takeover -- the suggestion
        // should open with an introduction, not jump straight into it.
        firstReply: !chat.messages.some((m) => m.from === "agent"),
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { suggestion?: string } | null) => {
        if (cancelled || !data?.suggestion) return
        setSuggestion(data.suggestion)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSuggesting(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveHandoffActive, customerMessageCount])

  function accept() {
    if (!selectedId) return
    setAccepted((prev) => new Set(prev).add(selectedId))
    setTab("handoff")
    if (isLive) chat.takeover()
  }

  function submitDraft() {
    if (!draft.trim()) return
    chat.send("agent", draft)
    setDraft("")
    setSuggestion(null)
  }

  function approveSuggestion() {
    if (!suggestion) return
    chat.send("agent", suggestion)
    setSuggestion(null)
  }

  function editSuggestion() {
    if (!suggestion) return
    setDraft(suggestion)
    setSuggestion(null)
  }

  const sidebar = (
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
    </aside>
  )

  if (selectedId === null) {
    return (
      <div className="flex min-h-svh flex-col bg-background lg:h-svh lg:overflow-hidden">
        <WorkspaceHeader active={null} used={[]} relay={relay} />

        <div className="grid min-h-0 flex-1 lg:grid-cols-[300px_minmax(0,1fr)_340px]">
          {sidebar}
          <main className="flex min-h-[520px] min-w-0 flex-col items-center justify-center gap-2 px-6 text-center lg:col-span-2 lg:min-h-0">
            <Sparkles className="size-6 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">
              Select a ticket to view the conversation
            </p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Pick any ticket from the queue on the left. The one marked with an
              eye is currently live with a customer.
            </p>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col bg-background lg:h-svh lg:overflow-hidden">
      <WorkspaceHeader
        active={activeSystem}
        used={reachedSteps.map((st) => st.system)}
        relay={relay}
      />

      <div className="grid min-h-0 flex-1 lg:grid-cols-[300px_minmax(0,1fr)_340px]">
        {sidebar}

        <main className="flex min-h-[520px] min-w-0 flex-col lg:min-h-0">
          <TicketHeader
            item={item}
            accepted={isAccepted}
            statusLabel={statusLabel}
            live={isLive}
            direction={direction}
            canTakeover={isLive && !liveHandoffActive}
            onTakeover={accept}
          />

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-muted/30 px-4 py-5 sm:px-6">
            <div className="mx-auto max-w-xl rounded-full border border-brand-teal/25 bg-brand-teal/10 px-4 py-2 text-center font-mono text-[11px] text-brand-navy dark:text-brand-teal">
              {direction === "outbound"
                ? `Outbound journey · ${item.channel} · Consent checked · Adam AI assigned${notified ? " · Notification sent, waiting for the customer" : ""}`
                : `Session started · ${item.channel} · CDP context loaded · Adam AI assigned`}
            </div>

            {before.map((turn, i) => (
              <TranscriptTurn
                key={turn.id}
                turn={turn}
                time={turnTime(i)}
                customer={item.customer}
              />
            ))}

            {aiDone &&
              !liveHandoffActive &&
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
                  time={turnTime(before.length + 2 + i)}
                  customer={item.customer}
                />
              ))}

            {liveHandoffActive && (
              <>
                <TakeoverDivider name={AGENT_NAME} />
                {chat.messages.map((m) => (
                  <LiveMessageRow
                    key={m.id}
                    message={m}
                    customer={item.customer}
                  />
                ))}
              </>
            )}

            {!liveHandoffActive && nextTurn && <TypingRow turn={nextTurn} />}
            <div ref={endRef} />
          </div>

          <div className="border-t border-border bg-card px-4 py-3">
            {liveHandoffActive && suggestion ? (
              <div className="rounded-xl border border-brand-teal/25 bg-brand-teal/10 p-3">
                <div className="mb-1.5 flex items-center gap-1 text-[11px] font-medium text-brand-navy dark:text-brand-teal">
                  <Sparkles className="size-3" /> Suggested reply
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-line text-foreground">
                  {suggestion}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={approveSuggestion}
                    className="flex items-center gap-1.5 rounded-lg bg-brand-navy px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-brand-navy/85"
                  >
                    <Check className="size-3.5" strokeWidth={3} /> Approve
                    &amp; Send
                  </button>
                  <button
                    onClick={editSuggestion}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ) : liveHandoffActive && suggesting && !draft.trim() ? (
              <div className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-[13px] text-muted-foreground">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-teal/70" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-brand-teal" />
                </span>
                Generating a suggested reply…
              </div>
            ) : (
              <div className="flex items-end gap-3">
                {liveHandoffActive ? (
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitDraft()}
                    placeholder="Type a message"
                    autoFocus
                    className="w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground outline-none focus:border-brand-teal"
                  />
                ) : (
                  <div className="flex-1 rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground">
                    {item.resolvedByAi
                      ? "Resolved by AI — no reply needed"
                      : isLive && isAccepted
                        ? "Connecting…"
                        : isAccepted
                          ? "Handoff accepted"
                          : "Accept the handoff to reply"}
                  </div>
                )}
                <button
                  onClick={liveHandoffActive ? submitDraft : undefined}
                  disabled={!liveHandoffActive || !draft.trim()}
                  aria-label="Send"
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-white transition-colors hover:bg-brand-navy/85 disabled:opacity-40"
                >
                  <ArrowUp className="size-4" />
                </button>
              </div>
            )}
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
                time={stepTime(steps.length - 1)}
                stepTime={stepTime}
              />
            ) : (
              <OrchestrationPanel
                steps={reachedSteps}
                later={steps.slice(reachedSteps.length)}
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
  used,
  relay,
}: {
  active: CaseSystem | null
  used: CaseSystem[]
  relay: ReturnType<typeof useLiveSession>
}) {
  return (
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 text-foreground dark:border-white/10 dark:bg-brand-navy dark:text-white">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-brand-navy text-sm font-bold text-white dark:bg-brand-teal dark:text-brand-navy">
          O
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">oneix</div>
          <div className="text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase dark:text-brand-teal/70">
            AI Agent Workspace
          </div>
        </div>
      </div>

      <div className="hidden items-center md:flex">
        {SYSTEMS.map((system, i) => {
          const on = active === system
          const done = !on && used.includes(system)
          const last = i === SYSTEMS.length - 1
          return (
            <div key={system} className="flex items-center">
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                    on || done
                      ? "bg-brand-navy text-white dark:bg-brand-teal dark:text-brand-navy"
                      : "bg-brand-teal/15 dark:bg-white/10",
                    on && "ring-2 ring-brand-teal/50"
                  )}
                >
                  {(on || done) && <Check className="size-3" strokeWidth={3} />}
                </span>
                <span
                  className={cn(
                    "text-xs transition-colors duration-300",
                    on
                      ? "font-semibold text-foreground dark:text-white"
                      : done
                        ? "text-muted-foreground dark:text-white/70"
                        : "text-muted-foreground/50 dark:text-white/35"
                  )}
                >
                  {system}
                </span>
              </div>
              {!last && (
                <span
                  className={cn(
                    "mx-2.5 h-px w-6 transition-colors duration-300",
                    done ? "bg-brand-teal/50" : "bg-border dark:bg-white/15"
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <RelayStatus relay={relay} />
        <ThemeToggle />
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-full bg-brand-navy text-sm font-bold text-white dark:bg-brand-teal dark:text-brand-navy">
            {AGENT_NAME[0]}
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">{AGENT_NAME}</div>
            <div className="text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase dark:text-brand-teal/70">
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
          ? "bg-card text-brand-navy shadow-sm dark:text-brand-teal"
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
          ? "border-brand-navy text-brand-navy dark:border-brand-teal dark:text-brand-teal"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

function Count({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-brand-teal/15 px-1.5 py-px text-[10px] text-brand-navy dark:text-brand-teal">
      {children}
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
          ? "border-brand-teal bg-brand-teal/10"
          : live
            ? "border-brand-navy bg-brand-teal/5 dark:border-brand-teal"
            : "border-transparent hover:bg-muted/50"
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "size-2 rounded-full",
            item.priority === "High" ? "bg-brand-navy" : "bg-brand-teal"
          )}
        />
        <span className="flex-1 truncate text-sm font-semibold text-foreground">
          {item.customer}
        </span>
        {live ? (
          <span className="flex items-center gap-1">
            <LiveIndicator />
            <span className="text-[10px] font-bold tracking-wide text-brand-navy uppercase dark:text-brand-teal">
              New ticket
            </span>
          </span>
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
        {LAST_MESSAGE[item.scenarioId]}
      </p>
    </button>
  )
}

function TicketHeader({
  item,
  accepted,
  statusLabel,
  live,
  direction,
  canTakeover,
  onTakeover,
}: {
  item: CaseFile
  accepted: boolean
  statusLabel: string
  live: boolean
  direction: "inbound" | "outbound"
  canTakeover: boolean
  onTakeover: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border bg-card px-4 py-4 sm:px-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "size-2.5 rounded-full",
              item.priority === "High" ? "bg-brand-navy" : "bg-brand-teal"
            )}
          />
          <h2 className="text-lg font-semibold text-foreground">
            {item.customer}
          </h2>
          <span className="rounded-full border border-brand-teal/30 bg-brand-teal/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand-navy dark:text-brand-teal">
            {item.tier}
          </span>
          <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
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
              accepted
                ? "text-brand-navy dark:text-brand-teal"
                : "text-muted-foreground"
            )}
          >
            {statusLabel}
          </span>
          {live && <LiveIndicator />}
        </div>
      </div>
      {canTakeover && (
        <button
          onClick={onTakeover}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-navy/85 dark:bg-brand-teal dark:text-brand-navy dark:hover:bg-brand-teal/85"
        >
          Takeover
        </button>
      )}
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
          ? "border-brand-teal/30 bg-brand-teal/10"
          : "border-border bg-muted/40"
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          accepted
            ? "bg-brand-teal/20 text-brand-navy dark:text-brand-teal"
            : "bg-muted text-muted-foreground"
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
          className="rounded-lg bg-brand-navy px-5 py-2 text-xs font-bold tracking-wider text-white uppercase transition-colors hover:bg-brand-navy/85"
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
  stepTime,
}: {
  item: CaseFile
  steps: CaseStep[]
  activeIndex: number | null
  onSelectStep?: (index: number) => void
  summaryReady: boolean
  time: string
  stepTime: (stepIndex: number) => string
}) {
  return (
    <>
      <section className="rounded-2xl border border-brand-teal/25 bg-brand-teal/10 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-brand-navy uppercase dark:text-brand-teal">
            <Sparkles className="size-3.5" /> AI Summary
          </h3>
          <span className="font-mono text-[10px] text-muted-foreground">
            {time}
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
            Adam is still handling this conversation. The summary is written at
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
                    active && "bg-brand-teal/10 ring-1 ring-brand-teal/30",
                    onSelectStep && !active && "hover:bg-muted"
                  )}
                >
                  <span>
                    {step.label}
                    <span
                      className={cn(
                        "mt-0.5 block font-mono text-[10px] tracking-wide uppercase",
                        active
                          ? "text-brand-navy dark:text-brand-teal"
                          : "text-muted-foreground"
                      )}
                    >
                      {step.system}
                    </span>
                  </span>
                  <span className="shrink-0 pt-0.5 font-mono text-[10px] text-muted-foreground">
                    {stepTime(i)}
                  </span>
                </Row>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-muted/40 p-4">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold tracking-wider text-muted-foreground uppercase">
          <Sparkles className="size-3.5" /> AI Agent Recommendations
        </h3>
        <ol className="space-y-2">
          {item.recommendation.map((rec, i) => (
            <li key={rec} className="flex gap-2 text-[13px] text-foreground">
              <span className="font-semibold text-brand-navy dark:text-brand-teal">
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
    <strong className="font-semibold text-brand-navy dark:text-brand-teal">
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
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-navy text-sm font-bold text-white">
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
          className="mt-2.5 flex items-center gap-1 text-[11px] font-semibold text-brand-navy dark:text-brand-teal"
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

/**
 * What each stage of the stack actually means for the business watching the
 * demo — generalized, not tied to any one scenario's script, so it reads the
 * same whether this ticket is a fraud case or a flight rebooking. The
 * case-specific steps rendered below each of these are what ties it back to
 * "here's what that meant for this interaction."
 */
const SYSTEM_INFO: Record<
  CaseSystem,
  { description: string; card: string; title: string }
> = {
  "Data Warehouse": {
    description:
      "Every transaction, account, and system event lives in one place, so nothing downstream is ever working from stale or partial data.",
    card: "border-brand-teal/25 bg-brand-teal/10",
    title: "text-brand-navy dark:text-brand-teal",
  },
  CDP: {
    description:
      "Unifies everything known about a customer into one live profile, so every conversation starts with full context instead of the customer repeating themselves.",
    card: "border-brand-teal/25 bg-brand-teal/10",
    title: "text-brand-navy dark:text-brand-teal",
  },
  Marketing: {
    description:
      "Turns that context into action — reaching the right customer with the right message at the right moment, automatically.",
    card: "border-brand-teal/25 bg-brand-teal/10",
    title: "text-brand-navy dark:text-brand-teal",
  },
  "AI Orchestrator": {
    description:
      "The decision-maker: understands what the customer needs, resolves it directly when it can, and hands off to a person with full context when it can't.",
    card: "border-brand-teal/25 bg-brand-teal/10",
    title: "text-brand-navy dark:text-brand-teal",
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
  later,
  activeSystem,
  aiDone,
}: {
  steps: CaseStep[]
  /** Steps the AI hasn't reached yet (when looking back at a finished ticket). */
  later: CaseStep[]
  activeSystem: CaseSystem | null
  aiDone: boolean
}) {
  return (
    <>
      <section className="rounded-2xl bg-brand-navy p-4 text-white">
        <h3 className="text-xs font-bold tracking-[0.18em] text-brand-teal uppercase">
          Orchestration
        </h3>
        <p className="mt-1.5 text-[13px] leading-snug text-white/80">
          From raw data to a resolved conversation — see what each layer of the
          stack does, and watch it happen here in real time.
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
                    done || active ? "bg-brand-teal/50" : "bg-border"
                  )}
                />
              )}
              <span
                className={cn(
                  "relative z-10 mt-2 flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                  active || done
                    ? "bg-brand-navy text-white"
                    : "bg-brand-teal/25 text-brand-navy dark:text-brand-teal",
                  active && "ring-4 ring-brand-teal/25"
                )}
              >
                {(active || done) && (
                  <Check className="size-4" strokeWidth={3} />
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
                    <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-brand-navy uppercase dark:text-brand-teal">
                      <span className="size-1.5 animate-pulse rounded-full bg-brand-teal" />
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {info.description}
                </p>

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
                    {aiDone && !later.some((l) => l.system === system)
                      ? "Not needed for this interaction"
                      : "Waiting…"}
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
    <div className="mb-1 ml-10 flex items-center gap-1.5 text-xs">
      <Sparkles className="size-3 text-brand-navy dark:text-brand-teal" />
      <span className="font-semibold text-brand-navy dark:text-brand-teal">
        Adam AI
      </span>
      <span className="font-mono text-[10px] text-muted-foreground">
        {time}
      </span>
    </div>
  )
}

function AdamAvatar() {
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-teal text-brand-navy">
      <Sparkles className="size-3.5" />
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
      if (turn.from === "agent") {
        return (
          <div className="flex flex-col items-end">
            <div className="max-w-[85%]">
              <div className="mb-1 flex items-center justify-end gap-1.5 text-xs">
                <span className="font-mono text-[10px] text-muted-foreground">
                  {time}
                </span>
                <span className="text-muted-foreground">Live Agent</span>
                <span className="font-semibold text-brand-navy dark:text-brand-teal">
                  {turn.speaker}
                </span>
              </div>
              <div className="rounded-2xl rounded-tr-md border border-brand-navy/20 bg-brand-navy/8 px-4 py-3 text-sm leading-relaxed whitespace-pre-line text-foreground">
                {turn.text}
              </div>
            </div>
          </div>
        )
      }
      return (
        <div className="flex flex-col items-start">
          <AiLabel time={time} />
          <div className="flex items-end gap-2">
            <AdamAvatar />
            <div className="max-w-[26rem] rounded-2xl rounded-bl-md border border-brand-teal/25 bg-brand-teal/10 px-4 py-3 text-sm leading-relaxed whitespace-pre-line text-foreground">
              {turn.text}
            </div>
          </div>
        </div>
      )
    }
    case "checklist":
      return (
        <div>
          <AiLabel time={time} />
          <div className="flex items-end gap-2">
            <AdamAvatar />
            <div className="max-w-[26rem] space-y-2 rounded-2xl rounded-bl-md border border-brand-teal/25 bg-brand-teal/10 px-4 py-3 text-sm text-foreground">
              {turn.intro && (
                <p className="whitespace-pre-line">{turn.intro}</p>
              )}
              <ul className="space-y-1">
                {turn.items.map((it) => (
                  <li key={it} className="flex items-start gap-1.5">
                    <Check
                      className="mt-0.5 size-3.5 shrink-0 text-brand-navy dark:text-brand-teal"
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
        </div>
      )
    case "reply":
      return (
        <div className="flex flex-col items-start">
          <div className="mb-1 ml-10 flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-foreground">
              {customer.split(" ")[0]}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {time}
            </span>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-navy text-[10px] font-bold text-white">
              {customer
                .split(" ")
                .map((w) => w[0])
                .slice(-2)
                .join("")}
            </div>
            <div className="max-w-[26rem] rounded-2xl rounded-bl-md bg-brand-navy px-4 py-3 text-sm leading-relaxed text-white">
              {turn.text}
            </div>
          </div>
        </div>
      )
    case "system":
    case "faceid":
      return (
        <div className="flex items-center justify-center gap-1.5 text-center font-mono text-[11px] text-muted-foreground">
          {turn.kind === "faceid" && (
            <ShieldCheck className="size-3.5 text-brand-navy dark:text-brand-teal" />
          )}
          {turn.text}
        </div>
      )
    case "alert":
      return (
        <div className="mx-auto max-w-sm rounded-xl border border-border bg-card px-4 py-2.5 text-center">
          <div className="text-[10px] font-bold tracking-wider text-brand-navy uppercase dark:text-brand-teal">
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
                  r.positive
                    ? "text-brand-navy dark:text-brand-teal"
                    : "text-foreground"
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

function LiveIndicator() {
  return (
    <span
      title="An agent is viewing this ticket"
      className="inline-flex text-brand-navy dark:text-brand-teal"
    >
      <Eye className="size-4" />
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
      <span className="font-semibold text-brand-navy dark:text-brand-teal">
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
  const tone =
    !relay.online || unconfigured
      ? "bg-muted-foreground/40 dark:bg-white/30"
      : "bg-brand-teal"
  return (
    <div
      className="hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:flex dark:text-white/70"
      title={
        unconfigured
          ? "Add an Upstash Redis integration on Vercel so separate devices can sync."
          : undefined
      }
    >
      <span className={cn("size-1.5 rounded-full", tone)} />
      {label}
      <span className="font-mono text-muted-foreground/70 dark:text-white/40">
        · {relay.room}
      </span>
    </div>
  )
}

function ResolvedCard({ note }: { note: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-brand-teal/25 bg-brand-teal/10 px-4 py-3.5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-teal/20 text-brand-navy dark:text-brand-teal">
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

function TakeoverDivider({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="h-px flex-1 bg-border" />
      <span className="flex items-center gap-1 text-[11px] whitespace-nowrap text-muted-foreground">
        {name} joined the conversation
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}

function LiveMessageRow({
  message,
  customer,
}: {
  message: LiveMessage
  customer: string
}) {
  if (message.from === "agent") {
    return (
      <div className="flex flex-col items-end">
        <div className="max-w-[85%]">
          <div className="mb-1 flex items-center justify-end gap-1.5 text-xs">
            <span className="text-muted-foreground">Live Agent</span>
            <span className="font-semibold text-brand-navy dark:text-brand-teal">
              {AGENT_NAME}
            </span>
          </div>
          <div className="rounded-2xl rounded-tr-md border border-brand-navy/20 bg-brand-navy/8 px-4 py-3 text-sm leading-relaxed whitespace-pre-line text-foreground">
            {message.text}
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-start">
      <div className="mb-1 ml-10 flex items-center gap-1.5 text-xs">
        <span className="font-semibold text-foreground">
          {customer.split(" ")[0]}
        </span>
      </div>
      <div className="flex items-end gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-navy text-[10px] font-bold text-white">
          {customer
            .split(" ")
            .map((w) => w[0])
            .slice(-2)
            .join("")}
        </div>
        <div className="max-w-[26rem] rounded-2xl rounded-bl-md bg-brand-navy px-4 py-3 text-sm leading-relaxed whitespace-pre-line text-white">
          {message.text}
        </div>
      </div>
    </div>
  )
}
