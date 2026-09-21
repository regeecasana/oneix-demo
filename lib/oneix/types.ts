export type IndustryId = "banking" | "travel" | "education" | "healthcare"

export type ScenarioDirection = "inbound" | "outbound"

export interface ScenarioSummary {
  id: string
  direction: ScenarioDirection
  title: string
  description: string
  available: boolean
  /** Push-notification copy shown before an outbound scenario's chat opens. */
  notification?: { sender: string; body: string }
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
      /**
       * Renders as several labeled buttons instead of the default single chip
       * (e.g. "Keep delayed flight" / "Move me to 7:05 AM" / "Show other
       * options"). Exactly one should be `correct` — clicking it sends `text`
       * as the reply; the others are shown disabled, since this demo only has
       * one scripted path.
       */
      choices?: { label: string; correct?: boolean }[]
    }
  | { kind: "system"; text: string }
  | { kind: "faceid"; text: string }
  | {
      kind: "checklist"
      from: "ai" | "agent"
      speaker: string
      intro?: string
      items: string[]
      /** A second, unchecked list shown after `items` — "here's what's still
       * needed" rather than "here's what's done". */
      pending?: string[]
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

export type CaseSystem = "Data Warehouse" | "CRM" | "Marketing/CDP" | "AI Orchestrator"

/** A run of summary text, optionally highlighted. */
export type SummaryPart = string | { text: string; tone: "danger" | "warn" }

/** The ticket an AI-to-human handoff opens on the Agent Workspace. */
export interface CaseFile {
  id: string
  scenarioId: string
  customer: string
  /** One-line issue shown under the name in the queue. */
  subject: string
  priority: "High" | "Medium"
  /** Time already spent waiting for an agent, e.g. "2m". */
  waiting: string
  /** Customer tier / product badge next to the name. */
  tier: string
  /** Issue badge next to the tier. */
  issue: string
  channel: string
  /** Enterprise systems the AI drew on — lit up in the header. */
  systems: CaseSystem[]
  summary: SummaryPart[]
  /** Technical steps the AI orchestrator took, in order. */
  steps: string[]
  /** Text on the "AI Handoff" card in the transcript. */
  handoffNote: string
  recommendation: string[]
  profile: { label: string; value: string }[]
}
