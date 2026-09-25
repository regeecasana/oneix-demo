"use client"

import { useEffect, useMemo, useState } from "react"
import type { AudioBatch } from "@/lib/oneix/get-audio-batch"
import { getAudioBatch } from "@/lib/oneix/get-audio-batch"
import { audioMap } from "@/lib/oneix/audio-map"
import { newSessionId, useSessionPublisher } from "./use-session-publisher"
import { useLiveChat } from "./use-live-chat"
import { AGENT_NAME } from "@/lib/oneix/live-chat"
import type { ChatTurn, TxnVerdict } from "@/lib/oneix/types"

/**
 * Drives a scripted conversation turn-by-turn: typed/timed reveal for turns with
 * no mapped clip, audio-synced reveal (via the `batch` handed to a mounted
 * `TurnAudioPlayer`) for turns that do. Shared by every chat-style surface
 * (the corner widget, the WhatsApp-style screen, ...) so the timing/audio logic
 * only lives in one place.
 */
interface ActiveSpeaker {
  name: string
  tone: "ai" | "agent"
}

/** Who the header/typing-indicator should show as currently speaking — derived
 * from the last message/checklist/handoff turn revealed, not just whether a
 * handoff ever happened, so the header correctly flips back to Ava if she
 * resumes the conversation after a live agent. */
function speakerFor(turn: ChatTurn): ActiveSpeaker | null {
  if (turn.kind === "message" || turn.kind === "checklist") {
    return { name: turn.speaker, tone: turn.from === "agent" ? "agent" : "ai" }
  }
  if (turn.kind === "handoff") {
    return { name: turn.to, tone: "agent" }
  }
  return null
}

export function useChatScript(scenarioId: string, script: ChatTurn[]) {
  const [sessionId] = useState(newSessionId)
  const [rendered, setRendered] = useState<ChatTurn[]>([])
  const [index, setIndex] = useState(0)
  const [typing, setTyping] = useState(false)
  const [activeSpeaker, setActiveSpeaker] = useState<ActiveSpeaker>({
    name: "Ava",
    tone: "ai",
  })
  const [verdicts, setVerdicts] = useState<Record<string, TxnVerdict>>({})

  // A human agent can take this conversation over at any point — from the
  // scripted handoff, or mid-AI via the Agent Workspace's Takeover button.
  // Once that happens the scripted engine below freezes and the transcript
  // continues as a real two-way exchange instead.
  const live = useLiveChat(sessionId)
  const liveHandoff = live.owner === "agent"

  // The scripted "Jordan" dialogue after a handoff is retired — once the
  // handoff turn itself has played, the script pauses there and waits for an
  // actual agent to accept in the Agent Workspace instead of auto-playing.
  const handoffIndex = useMemo(
    () => script.findIndex((t) => t.kind === "handoff"),
    [script]
  )
  const awaitingAgent =
    handoffIndex >= 0 && index > handoffIndex && !liveHandoff

  // Mirror progress to the Agent Workspace (/agent), which may be on another device.
  // A human takeover does NOT end the session here -- the customer is still
  // actively chatting, just with an agent instead of the script, so the
  // workspace needs to keep treating it as live.
  useSessionPublisher(
    sessionId,
    scenarioId,
    rendered.length,
    typing,
    !liveHandoff && rendered.length > 0 && rendered.length >= script.length
  )

  useEffect(() => {
    if (!liveHandoff) return
    setTyping(false)
    setActiveSpeaker({ name: AGENT_NAME, tone: "agent" })
  }, [liveHandoff])

  const pending =
    liveHandoff || awaitingAgent
      ? null
      : index < script.length
        ? script[index]
        : null
  const awaitingReply = pending?.kind === "reply"
  // Who the typing indicator's avatar should show — the *pending* turn's
  // speaker if it has one, so it doesn't lag a turn behind on a handoff.
  const typingSpeaker = (pending && speakerFor(pending)) || activeSpeaker

  // A reply immediately after a "transactions" turn stays hidden until every
  // item in that turn has been classified (see TxnCard) — the presenter picks
  // "This was me" / "Don't recognize" per item before the customer can respond.
  const lastRendered = rendered[rendered.length - 1]
  const requiresClassification =
    lastRendered?.kind === "transactions" &&
    lastRendered.items.some((item) => !verdicts[item.id])
  const readyToReply = awaitingReply && !requiresClassification

  function classify(itemId: string, verdict: TxnVerdict) {
    setVerdicts((v) => (v[itemId] ? v : { ...v, [itemId]: verdict }))
  }

  // Consecutive turns that share an audio `group` are the "sent together" bursts —
  // null here just means "this turn has no mapped clip, use the timed fallback".
  // A "faceid" turn is excluded even if one is mapped -- it must complete when
  // the camera panel says so, not whenever a clip happens to finish playing.
  const batch: AudioBatch | null = useMemo(
    () =>
      pending && pending.kind !== "faceid"
        ? getAudioBatch(audioMap, scenarioId, script, index)
        : null,
    [scenarioId, script, index, pending]
  )

  useEffect(() => {
    if (!pending || awaitingReply) return

    if (batch) {
      // TurnAudioPlayer (mounted by the caller) drives the reveal/advance via
      // onAudioStart/onAudioComplete below.
      setTyping(true)
      return
    }

    if (pending.kind === "faceid") {
      // No blind timer here -- the camera panel (mounted by the caller) only
      // calls completeFaceId once it has actually opened the camera and held
      // the preview for a couple of seconds, so this can't silently "verify"
      // without the camera ever having opened.
      setTyping(true)
      return
    }

    const isMessage = pending.kind === "message"
    const isChecklist = pending.kind === "checklist"
    const delay = isMessage
      ? 700 + Math.min(pending.text.length * 12, 1100)
      : isChecklist
        ? 1200
        : 500

    if (isMessage || isChecklist) setTyping(true)
    const t = setTimeout(() => {
      setTyping(false)
      const speaker = speakerFor(pending)
      if (speaker) setActiveSpeaker(speaker)
      setRendered((r) => [...r, pending])
      setIndex((i) => i + 1)
    }, delay)
    return () => clearTimeout(t)
    // Also re-run (and so cancel any in-flight timer) the instant a takeover
    // happens mid-turn, so a scripted bubble can't sneak in after a human joins.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, liveHandoff])

  function sendReply() {
    if (!pending || pending.kind !== "reply" || requiresClassification) return
    setRendered((r) => [...r, pending])
    setIndex((i) => i + 1)
  }

  function onAudioStart() {
    if (!batch) return
    setTyping(false)
    setRendered((r) => [...r, ...batch.turns])
    for (const turn of batch.turns) {
      const speaker = speakerFor(turn)
      if (speaker) setActiveSpeaker(speaker)
    }
  }

  function onAudioComplete() {
    if (!batch) return
    setIndex((i) => i + batch.turns.length)
  }

  /** Called by the camera panel once it has actually shown a live preview and
   * held it for its scan duration (or the operator dismissed it manually). */
  function completeFaceId() {
    if (!pending || pending.kind !== "faceid") return
    setTyping(false)
    setRendered((r) => [...r, pending])
    setIndex((i) => i + 1)
  }

  return {
    rendered,
    pending,
    typing,
    awaitingReply,
    readyToReply,
    batch,
    activeAgentName: activeSpeaker.name,
    activeAgentTone: activeSpeaker.tone,
    typingAgentName: typingSpeaker.name,
    typingAgentTone: typingSpeaker.tone,
    conversationEnded:
      !liveHandoff && !awaitingAgent && !pending && rendered.length > 0,
    sendReply,
    onAudioStart,
    onAudioComplete,
    completeFaceId,
    liveHandoff,
    awaitingAgent,
    liveMessages: live.messages,
    sendLiveMessage: (text: string) => live.send("customer", text),
    verdicts,
    classify,
  }
}
