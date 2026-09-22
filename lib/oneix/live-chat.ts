/**
 * The demo's fixed live-agent persona. Every scenario's scripted handoff also
 * names "Jordan" as the human agent, so a mid-conversation takeover (which has
 * no scripted name to draw on) uses the same one.
 */
export const AGENT_NAME = "Jordan"

/** Who currently owns the conversation on a live session. */
export type ChatOwner = "ai" | "agent"

/** One free-text message exchanged after a human agent takes over. */
export interface LiveMessage {
  id: string
  from: "agent" | "customer"
  text: string
  ts: number
}

export const MAX_MESSAGE_LENGTH = 2000
export const SESSION_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/
