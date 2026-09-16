import type { ChatTurn, ChatTurnContent } from "./types"

function keyFor(turn: ChatTurnContent): string {
  if (turn.kind === "message") return turn.from
  if (turn.kind === "reply") return "customer"
  return turn.kind
}

/**
 * Assigns each turn a stable id: `${scenarioId}-${speakerOrKind}-${nth occurrence}`.
 * E.g. the fraud script's two Jordan bubbles become `fraud-agent-1` / `fraud-agent-2`,
 * mirroring the `jamir-1` / `jamir-2` audio file naming so the mapping in
 * `audio-map.ts` reads naturally against the source clips.
 */
export function withTurnIds(scenarioId: string, turns: ChatTurnContent[]): ChatTurn[] {
  const counts: Record<string, number> = {}
  return turns.map((turn) => {
    const key = keyFor(turn)
    const n = (counts[key] ?? 0) + 1
    counts[key] = n
    return { ...turn, id: `${scenarioId}-${key}-${n}` }
  })
}
