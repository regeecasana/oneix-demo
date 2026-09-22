"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import type { ChatTurn, TxnVerdict } from "@/lib/oneix/types"
import { useChatScript } from "@/hooks/use-chat-script"
import { TurnAudioPlayer } from "./turn-audio-player"
import { TxnRow } from "./txn-row"
import { ReplyChoices } from "./reply-choices"
import { ArrowLeft, Video, Phone, X, Send, Mic, Check, Circle } from "./icons"

/** Fake, incrementing clock for the demo — starts at 10:23 AM, +1 min per bubble. */
function timeFor(i: number) {
  const total = 10 * 60 + 23 + i
  const h24 = Math.floor(total / 60) % 24
  const m = total % 60
  const h12 = ((h24 + 11) % 12) + 1
  return `${h12}:${String(m).padStart(2, "0")} ${h24 >= 12 ? "PM" : "AM"}`
}

function timeOf(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}

export function WhatsAppChat({
  scenarioId,
  script,
  onClose,
}: {
  scenarioId: string
  script: ChatTurn[]
  onClose: () => void
}) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState("")
  const {
    rendered,
    pending,
    typing,
    awaitingReply,
    readyToReply,
    batch,
    activeAgentName,
    activeAgentTone,
    conversationEnded,
    sendReply,
    onAudioStart,
    onAudioComplete,
    verdicts,
    classify,
    liveHandoff,
    awaitingAgent,
    liveMessages,
    sendLiveMessage,
  } = useChatScript(scenarioId, script)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [rendered, typing, liveMessages])

  function submitDraft() {
    if (!draft.trim()) return
    sendLiveMessage(draft)
    setDraft("")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[min(720px,calc(100vh-2rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[1.75rem] border border-black/10 bg-[#ece5dd] shadow-2xl dark:border-white/10 dark:bg-[#0b141a]">
        <div className="flex items-center gap-2 bg-[#075e54] px-3 py-3 text-white">
          <button onClick={onClose} className="rounded-full p-1 transition-colors hover:bg-white/10">
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-300 text-sm font-semibold text-[#075e54]">
            {activeAgentName[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">
              {activeAgentName} · {activeAgentTone === "agent" ? "Live Agent" : "AI Assistant"}
            </div>
            <div className="text-[11px] text-white/70">online</div>
          </div>
          <Video className="size-[18px] shrink-0 text-white/90" />
          <Phone className="size-4 shrink-0 text-white/90" />
          <button onClick={onClose} className="rounded-full p-1 transition-colors hover:bg-white/10">
            <X className="size-[18px]" />
          </button>
        </div>

        <div
          className="flex-1 space-y-2.5 overflow-y-auto px-3 py-4"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)",
            backgroundSize: "16px 16px",
          }}
        >
          <div className="mx-auto max-w-[85%] rounded-lg bg-white/95 px-3 py-2 text-center text-[11px] text-muted-foreground shadow-sm dark:bg-white/10">
            Messages are end-to-end encrypted. No one outside of this chat can read them.
          </div>

          {rendered.map((turn, i) => (
            <WhatsAppTurn key={i} turn={turn} time={timeFor(i)} verdicts={verdicts} onClassify={classify} />
          ))}

          {typing && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-lg rounded-tl-sm bg-white px-3 py-2.5 shadow-sm dark:bg-[#202c33]">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="size-1.5 animate-bounce rounded-full bg-muted-foreground/50"
                    style={{ animationDelay: `${i * 120}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          {liveHandoff && (
            <>
              <div className="mx-auto w-fit rounded-md bg-black/10 px-2.5 py-1 text-center text-[11px] text-muted-foreground dark:bg-white/10">
                {activeAgentName} joined the conversation
              </div>
              {liveMessages.map((m) => (
                <Bubble key={m.id} side={m.from === "agent" ? "in" : "out"} time={timeOf(m.ts)}>
                  {m.text}
                </Bubble>
              ))}
            </>
          )}

          {awaitingAgent && (
            <div className="mx-auto flex w-fit items-center gap-1.5 rounded-md bg-black/10 px-2.5 py-1 text-[11px] text-muted-foreground dark:bg-white/10">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-600" />
              </span>
              Waiting for a live agent to join…
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

        {!liveHandoff && readyToReply && pending?.kind === "reply" && pending.choices && (
          <div className="border-t border-black/5 bg-[#f7f7f7] px-3 pt-2.5 pb-1 dark:border-white/5 dark:bg-[#111b21]">
            <ReplyChoices
              choices={pending.choices}
              activeClassName="border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-[#2a3942] dark:text-emerald-200"
              onSelect={sendReply}
            />
          </div>
        )}

        <div className="flex items-center gap-2 bg-[#f0f0f0] px-3 py-2.5 dark:bg-[#1f2c34]">
          {liveHandoff ? (
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitDraft()}
              placeholder="Type a message"
              className="flex-1 rounded-full bg-white px-4 py-2 text-sm text-foreground shadow-sm outline-none dark:bg-[#2a3942]"
            />
          ) : readyToReply && pending?.kind === "reply" && !pending.choices ? (
            <button
              onClick={sendReply}
              className="flex-1 truncate rounded-full border border-emerald-300 bg-white px-4 py-2 text-left text-sm text-emerald-800 shadow-sm transition-colors hover:bg-emerald-50 dark:border-emerald-800 dark:bg-[#2a3942] dark:text-emerald-200"
            >
              {pending.text}
            </button>
          ) : (
            <div className="flex-1 truncate rounded-full bg-white px-4 py-2 text-sm text-muted-foreground shadow-sm dark:bg-[#2a3942]">
              {awaitingAgent ? "Waiting for a live agent…" : "Message"}
            </div>
          )}
          {liveHandoff ? (
            <button
              onClick={submitDraft}
              disabled={!draft.trim()}
              aria-label="Send"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white transition-opacity disabled:opacity-40"
            >
              <Send className="size-4" />
            </button>
          ) : (
            <>
              <Send className="size-5 shrink-0 text-muted-foreground/60" />
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white">
                <Mic className="size-4" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function WhatsAppTurn({
  turn,
  time,
  verdicts,
  onClassify,
}: {
  turn: ChatTurn
  time: string
  verdicts: Record<string, TxnVerdict>
  onClassify: (itemId: string, verdict: TxnVerdict) => void
}) {
  switch (turn.kind) {
    case "alert":
      return (
        <div className="mx-auto max-w-[88%] rounded-xl border border-amber-200 bg-amber-50 p-3 text-center shadow-[0_0_14px_rgba(16,185,129,0.25)] dark:border-amber-900/50 dark:bg-amber-950/30">
          <div className="text-[11px] font-semibold tracking-wide text-amber-700 uppercase dark:text-amber-400">
            {turn.title}
          </div>
          {turn.lines.map((l, i) => (
            <div
              key={i}
              className={cn("mt-1 text-xs", i === 0 ? "font-medium text-foreground" : "text-muted-foreground")}
            >
              {l}
            </div>
          ))}
        </div>
      )
    case "message":
      return (
        <Bubble side="in" time={time}>
          {turn.text}
        </Bubble>
      )
    case "checklist":
      return (
        <Bubble side="in" time={time}>
          <div className="space-y-1.5">
            {turn.intro && <div>{turn.intro}</div>}
            <div className="space-y-1">
              {turn.items.map((item, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
                  {item}
                </div>
              ))}
            </div>
            {turn.pending && (
              <div className="space-y-1">
                {turn.pending.map((item, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-muted-foreground">
                    <Circle className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/50" />
                    {item}
                  </div>
                ))}
              </div>
            )}
            {turn.outro && <div>{turn.outro}</div>}
          </div>
        </Bubble>
      )
    case "faceid":
      return (
        <div className="mx-auto w-fit rounded-md bg-black/10 px-2.5 py-1 text-center text-[11px] text-muted-foreground dark:bg-white/10">
          {turn.text}
        </div>
      )
    case "reply":
      return (
        <Bubble side="out" time={time}>
          {turn.text}
        </Bubble>
      )
    case "system":
      return (
        <div className="mx-auto w-fit rounded-md bg-black/10 px-2.5 py-1 text-center text-[11px] text-muted-foreground dark:bg-white/10">
          {turn.text}
        </div>
      )
    case "handoff":
      return (
        <div className="mx-auto w-fit rounded-md bg-black/10 px-2.5 py-1 text-center text-[11px] text-muted-foreground dark:bg-white/10">
          Connecting you to {turn.to} · {turn.role}
        </div>
      )
    case "transactions":
      return (
        <div className="mx-auto max-w-[85%] space-y-2">
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
        <Card>
          {turn.intro && <div className="mb-2 text-sm text-foreground">{turn.intro}</div>}
          <div className="space-y-2">
            {turn.options.map((opt) => (
              <div key={opt.id} className="rounded-lg border border-border/60 p-2">
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
        </Card>
      )
    case "payment":
      return (
        <Card>
          <div className="mb-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">{turn.title}</div>
          <div className="mb-2 text-[11px] text-muted-foreground">Source: {turn.source}</div>
          {turn.rows.map((row, i) => (
            <div key={i} className="flex justify-between py-0.5 text-xs">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-medium text-foreground">{row.amount}</span>
            </div>
          ))}
          <div className="mt-1.5 flex justify-between border-t border-border/60 pt-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <span>Total</span>
            <span>{turn.total}</span>
          </div>
        </Card>
      )
    case "status":
      return (
        <Card>
          <div className="mb-2 text-xs font-semibold text-foreground">{turn.title}</div>
          <div className="space-y-1">
            {turn.rows.map((row, i) => (
              <div key={i} className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">{row.label}</span>
                <span className={cn("font-medium", row.positive ? "text-emerald-600" : "text-foreground")}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )
  }
}

function Bubble({ side, time, children }: { side: "in" | "out"; time: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex", side === "out" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "relative max-w-[78%] rounded-lg py-2 pr-9 pl-3 text-sm leading-snug whitespace-pre-line shadow-sm",
          side === "out"
            ? "rounded-tr-sm bg-[#d9fdd3] text-foreground dark:bg-[#005c4b] dark:text-white"
            : "rounded-tl-sm bg-white text-foreground dark:bg-[#202c33] dark:text-white",
        )}
      >
        {children}
        <span className="absolute right-2 bottom-1 text-[10px] whitespace-nowrap text-muted-foreground/70">
          {time}
        </span>
      </div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[85%] rounded-lg bg-white p-3 shadow-sm dark:bg-[#202c33]">{children}</div>
  )
}
