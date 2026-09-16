import type { AudioMap } from "./types"

/**
 * Maps a chat turn's stable `id` (see `turn-ids.ts`) to the voice clip that should
 * play while its bubble is "typing". Clips live under `public/audio/...` so the
 * paths below are servable directly.
 *
 * Turns are voiced incrementally — a turn with no entry here just falls back to
 * the timed typing-indicator simulation in `chat-widget.tsx`. Turns sharing a
 * `group` play back-to-back behind a single typing indicator, with `order`
 * controlling the sequence — that's how "two bubbles sent at once" (e.g. Jordan's
 * opening recap, split into `fraud-agent-1` / `fraud-agent-2`) is expressed.
 *
 * Directory convention: audio/{industry}/{role: ai|agent}/{direction: inbound|outbound}/{clip}.mp3
 */
export const audioMap: AudioMap = {
  fraud: {
    "fraud-agent-1": {
      src: "/audio/bfsi/agent/inbound/jamir-1.mp3",
      group: "fraud-jordan-open",
      order: 1,
    },
    "fraud-agent-2": {
      src: "/audio/bfsi/agent/inbound/jamir-2.mp3",
      group: "fraud-jordan-open",
      order: 2,
    },
  },
  collections: {},
}
