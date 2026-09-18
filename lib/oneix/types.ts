export type IndustryId = "banking" | "travel" | "education" | "healthcare"

export type ScenarioDirection = "inbound" | "outbound"

export interface ScenarioSummary {
  id: string
  direction: ScenarioDirection
  title: string
  description: string
  available: boolean
}

export interface IndustryDef {
  id: IndustryId
  label: string
  icon: "landmark" | "globe" | "graduation-cap" | "heart"
  scenarios: ScenarioSummary[]
}

/** A customer's classification of a flagged transaction. */
export type TxnVerdict = "mine" | "unknown"

export type ChatTurnContent =
  | { kind: "alert"; title: string; lines: string[] }
  | { kind: "message"; from: "ai" | "agent"; speaker: string; text: string }
  | {
      kind: "reply"
      text: string
      helper?: string
    }
  | { kind: "system"; text: string }
  | { kind: "faceid"; text: string }
  | {
      kind: "checklist"
      from: "ai" | "agent"
      speaker: string
      intro?: string
      items: string[]
      outro?: string
    }
  | { kind: "handoff"; to: string; role: string }
  | {
      kind: "options"
      intro?: string
      options: { id: string; heading: string; lines: string[] }[]
      outro?: string
    }
  | {
      kind: "transactions"
      items: { id: string; label: string; amount: string; time: string; correctVerdict: TxnVerdict }[]
    }
  | { kind: "payment"; title: string; source: string; rows: { label: string; amount: string }[]; total: string }
  | { kind: "status"; title: string; rows: { label: string; value: string; positive?: boolean }[] }

/**
 * `id` is stable per turn (assigned by `withTurnIds`, keyed off scenario + speaker
 * + occurrence count) so the audio manifest in `audio-map.ts` can reference a turn
 * without depending on its position in the script array.
 */
export type ChatTurn = ChatTurnContent & { id: string }

/**
 * One playable clip bound to a turn `id`. Turns sharing a `group` (with `order`
 * giving playback sequence) are the "sent together" bursts — the chat widget shows
 * a single typing indicator for the whole group and reveals each bubble as its own
 * clip starts, instead of pausing between them.
 */
export interface AudioClip {
  src: string
  group?: string
  order?: number
}

export type AudioMap = Record<string, Record<string, AudioClip>>

export interface CaseFile {
  id: string
  scenarioId: string
  customer: string
  authNote: string
  intent: string
  facts: string[]
  actionsCompleted: string[]
  recommendation: string[]
  reason: string
}
