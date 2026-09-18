"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import type { ChatTurn, TxnVerdict } from "@/lib/oneix/types"
import { useChatScript } from "@/hooks/use-chat-script"
import { X, ShieldAlert, ScanFace, ShieldCheck, Check, Circle } from "./icons"
import { TurnAudioPlayer } from "./turn-audio-player"
import { TxnRow } from "./txn-row"
import { ReplyChoices } from "./reply-choices"

function Avatar({ label, tone }: { label: string; tone: "ai" | "agent" | "customer" }) {
  return (
    <div
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white",
        tone === "ai" && "bg-teal-500",
        tone === "agent" && "bg-indigo-500",
        tone === "customer" && "bg-slate-400",
      )}
    >
      {label}
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-3 py-2.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 animate-bounce rounded-full bg-muted-foreground/50"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  )
}

function FaceIdScan() {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-2.5">
      <div className="relative flex size-5 shrink-0 items-center justify-center">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-teal-400/60" />
        <ScanFace className="relative size-4 text-teal-600 dark:text-teal-400" />
      </div>
      <span className="text-xs text-muted-foreground">Scanning Face ID…</span>
    </div>
  )
}

function SystemPulse() {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground italic">
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-teal-400/70" />
        <span className="relative inline-flex size-1.5 rounded-full bg-teal-500 dark:bg-teal-400" />
      </span>
      Processing…
    </div>
  )
}

export function ChatWidget({
  scenarioId,
  script,
  title,
  badgeLabel,
  subtitle,
  onClose,
}: {
  scenarioId: string
  script: ChatTurn[]
  title: string
  badgeLabel: string
  subtitle: string
  onClose: () => void
}) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const {
    rendered,
    pending,
    typing,
    awaitingReply,
    readyToReply,
    batch,
    activeAgentName,
    activeAgentTone,
    typingAgentName,
    typingAgentTone,
    conversationEnded,
    sendReply,
    onAudioStart,
    onAudioComplete,
    verdicts,
    classify,
  } = useChatScript(scenarioId, script)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [rendered, typing])

  return (
    <div className="fixed right-4 bottom-4 z-50 flex h-[min(640px,calc(100vh-2rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
      <div className="flex items-start justify-between border-b border-border bg-linear-to-r from-[#0b1f26] to-[#0a1520] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Avatar label={activeAgentName[0]} tone={activeAgentTone} />
          <div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-white">
              {activeAgentName}
              <span className="text-white/40">·</span>
              <span className="text-white/50">{activeAgentTone === "agent" ? "Live Agent" : "AI Assistant"}</span>
              <span className="ml-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-medium text-white/70">
                {badgeLabel}
              </span>
            </div>
            <div className="text-xs text-teal-300/70">{subtitle}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {rendered.map((turn, i) => (
          <TurnView key={i} turn={turn} verdicts={verdicts} onClassify={classify} />
        ))}
        {typing && pending?.kind === "faceid" && (
          <div className="flex justify-center">
            <FaceIdScan />
          </div>
        )}
        {typing && (pending?.kind === "system" || pending?.kind === "handoff") && (
          <div className="flex justify-center">
            <SystemPulse />
          </div>
        )}
        {typing && pending?.kind !== "faceid" && pending?.kind !== "system" && pending?.kind !== "handoff" && (
          <div className="flex items-end gap-2">
            <Avatar label={typingAgentName[0]} tone={typingAgentTone} />
            <TypingDots />
          </div>
        )}
        {conversationEnded && (
          <div className="pt-1 text-center text-[11px] text-muted-foreground">Conversation ended</div>
        )}
        <div ref={bottomRef} />
      </div>

      {batch && !awaitingReply && (
        <TurnAudioPlayer key={pending!.id} clips={batch.clips} onStart={onAudioStart} onComplete={onAudioComplete} />
      )}

      <div className="border-t border-border px-4 py-3">
        {readyToReply && pending?.kind === "reply" ? (
          pending.choices ? (
            <ReplyChoices
              choices={pending.choices}
              activeClassName="border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-200 dark:hover:bg-teal-950/70"
              onSelect={sendReply}
            />
          ) : (
            <button
              onClick={sendReply}
              className="w-full rounded-xl border border-teal-300 bg-teal-50 px-3 py-2 text-left text-sm text-teal-800 transition-colors hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-200 dark:hover:bg-teal-950/70"
            >
              {pending.text}
            </button>
          )
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            {pending ? "Waiting for response…" : title}
          </div>
        )}
        <p className="mt-2 text-center text-[10px] text-muted-foreground">Orchestrated by oneix</p>
      </div>
    </div>
  )
}

function TurnView({
  turn,
  verdicts,
  onClassify,
}: {
  turn: ChatTurn
  verdicts: Record<string, TxnVerdict>
  onClassify: (itemId: string, verdict: TxnVerdict) => void
}) {
  switch (turn.kind) {
    case "alert":
      return (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-900/50 dark:bg-red-950/30">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-red-500" />
          <div>
            <div className="text-xs font-semibold text-red-600 dark:text-red-400">{turn.title}</div>
            {turn.lines.map((l, i) => (
              <div key={i} className="text-xs text-red-700/80 dark:text-red-300/70">
                {l}
              </div>
            ))}
          </div>
        </div>
      )
    case "message":
      return (
        <div className="flex items-end gap-2">
          <Avatar label={turn.speaker[0]} tone={turn.from === "agent" ? "agent" : "ai"} />
          <div>
            <div className="mb-0.5 text-[10px] text-muted-foreground">{turn.speaker}</div>
            <div
              className={cn(
                "max-w-[260px] rounded-2xl rounded-bl-sm px-3 py-2 text-sm leading-snug whitespace-pre-line",
                turn.from === "agent"
                  ? "bg-indigo-50 text-indigo-950 dark:bg-indigo-950/40 dark:text-indigo-100"
                  : "bg-muted text-foreground",
              )}
            >
              {turn.text}
            </div>
          </div>
        </div>
      )
    case "checklist":
      return (
        <div className="flex items-end gap-2">
          <Avatar label={turn.speaker[0]} tone={turn.from === "agent" ? "agent" : "ai"} />
          <div>
            <div className="mb-0.5 text-[10px] text-muted-foreground">{turn.speaker}</div>
            <div className="max-w-[260px] space-y-1.5 rounded-2xl rounded-bl-sm bg-muted px-3 py-2">
              {turn.intro && <div className="text-sm text-foreground">{turn.intro}</div>}
              <div className="space-y-1">
                {turn.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-sm text-foreground">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-teal-600 dark:text-teal-400" strokeWidth={3} />
                    {item}
                  </div>
                ))}
              </div>
              {turn.pending && (
                <div className="space-y-1">
                  {turn.pending.map((item, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                      <Circle className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/50" />
                      {item}
                    </div>
                  ))}
                </div>
              )}
              {turn.outro && <div className="text-sm text-foreground">{turn.outro}</div>}
            </div>
          </div>
        </div>
      )
    case "reply":
      return (
        <div className="flex justify-end">
          <div className="max-w-[260px] rounded-2xl rounded-br-sm bg-[#0a1520] px-3 py-2 text-sm leading-snug text-white">
            {turn.text}
          </div>
        </div>
      )
    case "system":
      return (
        <div className="text-center text-[11px] text-muted-foreground italic">{turn.text}</div>
      )
    case "faceid":
      return (
        <div className="flex items-center justify-center gap-1.5 py-0.5 text-xs font-medium text-teal-700 dark:text-teal-300">
          <ShieldCheck className="size-3.5" />
          {turn.text}
        </div>
      )
    case "handoff":
      return (
        <div className="flex items-center gap-2 py-1">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[11px] whitespace-nowrap text-muted-foreground">
            Connecting you to {turn.to} · {turn.role}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
      )
    case "transactions":
      return (
        <div className="space-y-2">
          {turn.items.map((item) => (
            <TxnRow
              key={item.id}
              item={item}
              verdict={verdicts[item.id]}
              onClassify={(v) => onClassify(item.id, v)}
            />
          ))}
        </div>
      )
    case "options":
      return (
        <div className="rounded-xl border border-border bg-muted/30 p-2.5">
          {turn.intro && <div className="mb-2 text-sm text-foreground">{turn.intro}</div>}
          <div className="space-y-2">
            {turn.options.map((opt) => (
              <div key={opt.id} className="rounded-lg border border-border bg-card p-2">
                <div className="text-sm font-semibold text-foreground">{opt.heading}</div>
                {opt.lines.map((l, i) => (
                  <div key={i} className="text-xs text-muted-foreground">
                    {l}
                  </div>
                ))}
              </div>
            ))}
          </div>
          {turn.outro && <div className="mt-2 text-sm text-foreground">{turn.outro}</div>}
        </div>
      )
    case "payment":
      return (
        <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3 text-xs dark:border-teal-900/50 dark:bg-teal-950/20">
          <div className="mb-1.5 text-xs font-semibold text-teal-800 dark:text-teal-300">{turn.title}</div>
          <div className="mb-2 text-[11px] text-muted-foreground">Source: {turn.source}</div>
          {turn.rows.map((row, i) => (
            <div key={i} className="flex justify-between py-0.5">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-medium text-foreground">{row.amount}</span>
            </div>
          ))}
          <div className="mt-1.5 flex justify-between border-t border-teal-200/60 pt-1.5 font-semibold text-teal-800 dark:border-teal-900/50 dark:text-teal-300">
            <span>Total</span>
            <span>{turn.total}</span>
          </div>
        </div>
      )
    case "status":
      return (
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <div className="mb-2 text-xs font-semibold text-foreground">{turn.title}</div>
          <div className="space-y-1">
            {turn.rows.map((row, i) => (
              <div key={i} className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">{row.label}</span>
                <span className={cn("font-medium", row.positive ? "text-teal-600" : "text-foreground")}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
  }
}
