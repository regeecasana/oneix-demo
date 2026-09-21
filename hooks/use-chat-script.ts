"use client"

import { useEffect, useMemo, useState } from "react"
import type { AudioBatch } from "@/lib/oneix/get-audio-batch"
import { getAudioBatch } from "@/lib/oneix/get-audio-batch"
import { audioMap } from "@/lib/oneix/audio-map"
import { useSessionPublisher } from "./use-session-publisher"
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
  const [rendered, setRendered] = useState<ChatTurn[]>([])
  const [index, setIndex] = useState(0)
  const [typing, setTyping] = useState(false)
  const [activeSpeaker, setActiveSpeaker] = useState<ActiveSpeaker>({
    name: "Ava",
    tone: "ai",
  })
  const [verdicts, setVerdicts] = useState<Record<string, TxnVerdict>>({})

  // Mirror progress to the Agent Workspace (/agent), which may be on another device.
  useSessionPublisher(
    scenarioId,
    rendered.length,
    typing,
    rendered.length > 0 && rendered.length >= script.length
  )

  const pending = index < script.length ? script[index] : null
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
  const batch: AudioBatch | null = useMemo(
    () => (pending ? getAudioBatch(audioMap, scenarioId, script, index) : null),
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

    const isMessage = pending.kind === "message"
    const isFaceId = pending.kind === "faceid"
    const isChecklist = pending.kind === "checklist"
    const delay = isMessage
      ? 700 + Math.min(pending.text.length * 12, 1100)
      : isFaceId
        ? 1600
        : isChecklist
          ? 1200
          : 500

    if (isMessage || isFaceId || isChecklist) setTyping(true)
    const t = setTimeout(() => {
      setTyping(false)
      const speaker = speakerFor(pending)
      if (speaker) setActiveSpeaker(speaker)
      setRendered((r) => [...r, pending])
      setIndex((i) => i + 1)
    }, delay)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

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
    conversationEnded: !pending && rendered.length > 0,
    sendReply,
    onAudioStart,
    onAudioComplete,
    verdicts,
    classify,
  }
}
