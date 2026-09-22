"use client"

import { useEffect, useRef, useState } from "react"
import { currentRoom } from "@/lib/oneix/live-session"
import type { ChatOwner, LiveMessage } from "@/lib/oneix/live-chat"

const POLL_MS = 1200

/**
 * Polls the free-text conversation for one session: who owns it (`"ai"` until
 * a human agent takes over, `"agent"` after) and the messages exchanged since.
 * Used on both sides — the customer widgets and the Agent Workspace composer —
 * so a takeover and every message sent either way reach the other screen
 * within a poll interval, including across devices.
 */
export function useLiveChat(sessionId: string | null) {
  const [owner, setOwner] = useState<ChatOwner>("ai")
  const [messages, setMessages] = useState<LiveMessage[]>([])
  const room = useRef(currentRoom())

  useEffect(() => {
    setOwner("ai")
    setMessages([])
    if (!sessionId) return
    let stopped = false

    async function poll() {
      if (document.hidden) return
      try {
        const res = await fetch(`/api/chat?room=${room.current}&sessionId=${sessionId}`, {
          cache: "no-store",
        })
        if (!res.ok) return
        const json = (await res.json()) as { owner: ChatOwner; messages: LiveMessage[] }
        if (!stopped) {
          setOwner(json.owner)
          setMessages(json.messages)
        }
      } catch {
        // Best effort — the relay being briefly unreachable shouldn't break the demo.
      }
    }

    poll()
    const timer = setInterval(poll, POLL_MS)
    return () => {
      stopped = true
      clearInterval(timer)
    }
  }, [sessionId])

  function send(from: "agent" | "customer", text: string) {
    if (!sessionId || !text.trim()) return
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room: room.current, sessionId, message: { from, text } }),
    }).catch(() => {})
  }

  function takeover() {
    if (!sessionId) return
    setOwner("agent") // optimistic — the next poll confirms it
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room: room.current, sessionId, action: "takeover" }),
    }).catch(() => {})
  }

  return { owner, messages, send, takeover }
}
