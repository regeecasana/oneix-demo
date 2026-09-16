export type IndustryId = "banking" | "retail" | "travel" | "healthcare"

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
  icon: "landmark" | "shopping-bag" | "globe" | "heart"
  scenarios: ScenarioSummary[]
}

export type ChatTurn =
  | { kind: "alert"; title: string; lines: string[] }
  | { kind: "message"; from: "ai" | "agent"; speaker: string; text: string }
  | {
      kind: "reply"
      text: string
      helper?: string
    }
  | { kind: "system"; text: string }
  | { kind: "handoff"; to: string; role: string }
  | { kind: "transactions"; items: { label: string; amount: string; time: string }[] }
  | { kind: "payment"; title: string; source: string; rows: { label: string; amount: string }[]; total: string }
  | { kind: "status"; title: string; rows: { label: string; value: string; positive?: boolean }[] }

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
