"use client"

import { useEffect, useRef, useState } from "react"
import {
  currentRoom,
  type LiveSession,
  type LiveStage,
  type LiveStatus,
} from "@/lib/oneix/live-session"

export function newSessionId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  )
}

interface Progress {
  scenarioId: string
  revealed: number
  typing: boolean
}

/** Fire-and-forget: the demo must never depend on the relay being reachable. */
export function publishSession(
  status: LiveStatus,
  sessionId: string,
  progress: Progress,
  stage: LiveStage = "chat"
) {
  const session: LiveSession = {
    ...progress,
    sessionId,
    status,
    stage,
    ts: Date.now(),
  }
  // keepalive lets an "ended" update survive the chat closing / the page unloading.
  fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ room: currentRoom(), session }),
    keepalive: true,
  }).catch(() => {})
}

/**
 * Publishes how far the customer has got so the Agent Workspace can follow
 * along in real time.
 */
export function useSessionPublisher(
  scenarioId: string,
  revealed: number,
  typing: boolean
) {
  const [sessionId] = useState(newSessionId)
  const latest = useRef({ scenarioId, revealed, typing })
  latest.current = { scenarioId, revealed, typing }

  useEffect(() => {
    publishSession("active", sessionId, { scenarioId, revealed, typing })
  }, [scenarioId, revealed, typing, sessionId])

  useEffect(() => {
    return () => publishSession("ended", sessionId, latest.current)
  }, [sessionId])
}
