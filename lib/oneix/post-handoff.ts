import type { ChatTurn } from "./types"

/** One line of the scripted conversation that would have played after the
 * handoff -- flattened from `message`/`reply` turns into a plain from/text
 * exchange so both the customer widgets and the Agent Workspace can walk the
 * same sequence when replaying it as real live-chat messages. */
export interface PostHandoffTurn {
  from: "agent" | "customer"
  text: string
  choices?: { label: string; correct?: boolean }[]
}

/** Returns the ordered agent/customer exchange after `script`'s handoff turn,
 * or `[]` if the scenario has no handoff. */
export function postHandoffExchange(script: ChatTurn[]): PostHandoffTurn[] {
  const handoffAt = script.findIndex((t) => t.kind === "handoff")
  if (handoffAt < 0) return []

  const exchange: PostHandoffTurn[] = []
  for (const turn of script.slice(handoffAt + 1)) {
    if (turn.kind === "message") {
      exchange.push({ from: "agent", text: turn.text })
    } else if (turn.kind === "reply") {
      exchange.push({ from: "customer", text: turn.text, choices: turn.choices })
    }
  }
  return exchange
}
