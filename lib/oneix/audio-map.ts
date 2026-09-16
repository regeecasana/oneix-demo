import type { AudioMap } from "./types"

/**
 * Maps a chat turn's stable `id` (see `turn-ids.ts`) to the voice clip that should
 * play while its bubble is "typing". Clips live under `public/audio/...` so the
 * paths below are servable directly.
 *
 * Turns are voiced incrementally — a turn with no entry here just falls back to
 * the timed typing-indicator simulation in `chat-widget.tsx`. Turns sharing a
 * `group` play back-to-back behind a single typing indicator, with `order`
 * controlling the sequence — that's how "two bubbles sent at once" would be
 * expressed for turns that are immediately consecutive in the script (a customer
 * reply between two turns breaks the run, so they just voice independently).
 *
 * Directory convention: audio/{industry}/{scenarioId}/{speakerSlug}/{clip}.mp3
 * — keyed by the actual character speaking (ava, jordan, sofia, ...) rather than
 * a fixed "ai vs agent" role, since a scenario isn't guaranteed to have exactly
 * one of each.
 */
export const audioMap: AudioMap = {
  fraud: {
    "fraud-ai-1": {
      src: "/audio/bfsi/fraud/ava/1.mp3",
    },
    "fraud-ai-2": {
      src: "/audio/bfsi/fraud/ava/2.mp3",
    },
  },
  collections: {},
}
