export type LiveStatus = "active" | "ended"

/**
 * Outbound scenarios start with a push notification before any chat exists:
 * "notified" means it was sent but the customer has not opened the chat yet.
 */
export type LiveStage = "notified" | "chat"

/**
 * What the customer demo publishes so the Agent Workspace (possibly on another
 * device) can follow along. It's deliberately just a pointer into the scenario's
 * script: the agent renders the conversation itself from `revealed`.
 */
export interface LiveSession {
  sessionId: string
  scenarioId: string
  /** How many of the script's turns the customer has seen so far. */
  revealed: number
  /** True while the next bubble is being "typed". */
  typing: boolean
  status: LiveStatus
  stage?: LiveStage
  /** Publisher's clock; only used to order updates from the same session. */
  ts: number
}

/** Both screens pair up through a room name. Booths can run in parallel with ?room=. */
export const DEFAULT_ROOM = "booth"
export const ROOM_PATTERN = /^[a-z0-9_-]{1,32}$/i

export function currentRoom(): string {
  if (typeof window === "undefined") return DEFAULT_ROOM
  const room = new URLSearchParams(window.location.search).get("room")
  return room && ROOM_PATTERN.test(room) ? room : DEFAULT_ROOM
}
