"use client"

import { useEffect, useRef, useState } from "react"
import {
  currentRoom,
  type LiveSession,
  type LiveStatus,
} from "@/lib/oneix/live-session"

function newSessionId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  )
}

function post(
  status: LiveStatus,
  session: Omit<LiveSession, "status" | "ts" | "sessionId">,
  sessionId: string
) {
  const payload = {
    room: currentRoom(),
    session: { ...session, sessionId, status, ts: Date.now() },
  }
  // keepalive lets the "ended" update survive the chat closing / the page unloading.
  fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Best effort: the demo must never depend on the relay being reachable.
  })
}

/**
 * Publishes how far the customer has got so the Agent Workspace can follow
 * along in real time. Fire-and-forget; failures are ignored.
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
    post("active", { scenarioId, revealed, typing }, sessionId)
  }, [scenarioId, revealed, typing, sessionId])

  useEffect(() => {
    return () => post("ended", latest.current, sessionId)
  }, [sessionId])
}
