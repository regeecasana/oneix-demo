"use client"

import { useEffect, useState } from "react"
import {
  DEFAULT_ROOM,
  currentRoom,
  type LiveSession,
} from "@/lib/oneix/live-session"

const POLL_MS = 1500

interface LiveState {
  session: LiveSession | null
  /** How long ago the server last heard from the customer demo. */
  ageMs: number | null
  store: "redis" | "memory" | null
  /** Whether the last poll reached the server. */
  online: boolean
  room: string
}

/** Follows the customer demo in this room by polling the relay. */
export function useLiveSession(): LiveState {
  const [state, setState] = useState<LiveState>({
    session: null,
    ageMs: null,
    store: null,
    online: true,
    room: DEFAULT_ROOM,
  })

  useEffect(() => {
    const room = currentRoom()
    let stopped = false

    async function poll() {
      if (document.hidden) return
      try {
        const res = await fetch(`/api/session?room=${room}`, {
          cache: "no-store",
        })
        if (!res.ok) throw new Error(String(res.status))
        const json = (await res.json()) as Pick<
          LiveState,
          "session" | "ageMs" | "store"
        >
        if (!stopped) setState({ ...json, online: true, room })
      } catch {
        if (!stopped) setState((s) => ({ ...s, online: false, room }))
      }
    }

    poll()
    const timer = setInterval(poll, POLL_MS)
    return () => {
      stopped = true
      clearInterval(timer)
    }
  }, [])

  return state
}
