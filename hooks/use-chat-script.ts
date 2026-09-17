"use client"

import { useEffect, useMemo, useState } from "react"
import type { AudioBatch } from "@/lib/oneix/get-audio-batch"
import { getAudioBatch } from "@/lib/oneix/get-audio-batch"
import { audioMap } from "@/lib/oneix/audio-map"
import type { ChatTurn } from "@/lib/oneix/types"

/**
 * Drives a scripted conversation turn-by-turn: typed/timed reveal for turns with
 * no mapped clip, audio-synced reveal (via the `batch` handed to a mounted
 * `TurnAudioPlayer`) for turns that do. Shared by every chat-style surface
 * (the corner widget, the WhatsApp-style screen, ...) so the timing/audio logic
 * only lives in one place.
 */
export function useChatScript(scenarioId: string, script: ChatTurn[]) {
  const [rendered, setRendered] = useState<ChatTurn[]>([])
  const [index, setIndex] = useState(0)
  const [typing, setTyping] = useState(false)
  const [handoffTo, setHandoffTo] = useState<string | null>(null)

  const pending = index < script.length ? script[index] : null
  const awaitingReply = pending?.kind === "reply"

  // Consecutive turns that share an audio `group` are the "sent together" bursts —
  // null here just means "this turn has no mapped clip, use the timed fallback".
  const batch: AudioBatch | null = useMemo(
    () => (pending ? getAudioBatch(audioMap, scenarioId, script, index) : null),
    [scenarioId, script, index, pending],
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
      if (pending.kind === "handoff") setHandoffTo(pending.to)
      setRendered((r) => [...r, pending])
      setIndex((i) => i + 1)
    }, delay)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  function sendReply() {
    if (!pending || pending.kind !== "reply") return
    setRendered((r) => [...r, pending])
    setIndex((i) => i + 1)
  }

  function onAudioStart() {
    if (!batch) return
    setTyping(false)
    setRendered((r) => [...r, ...batch.turns])
    const handoffTurn = batch.turns.find((t) => t.kind === "handoff")
    if (handoffTurn?.kind === "handoff") setHandoffTo(handoffTurn.to)
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
    batch,
    handoffTo,
    activeAgentName: handoffTo ?? "Ava",
    conversationEnded: !pending && rendered.length > 0,
    sendReply,
    onAudioStart,
    onAudioComplete,
  }
}
