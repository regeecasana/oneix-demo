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
 * one of each. Non-dialogue sound effects (chimes, dings) that aren't tied to a
 * character or scenario live in audio/sfx/{clip}.mp3 instead.
 */
const DING = "/audio/sfx/ding.mp3"

export const audioMap: AudioMap = {
  fraud: {
    "fraud-ai-1": { src: "/audio/bfsi/fraud/ava/1.mp3" },
    "fraud-ai-2": { src: "/audio/bfsi/fraud/ava/2.mp3" },
    // Short confirmation chime, not a spoken line.
    "fraud-faceid-1": { src: DING },
    "fraud-ai-3": { src: "/audio/bfsi/fraud/ava/3.mp3" },
    "fraud-ai-4": { src: "/audio/bfsi/fraud/ava/4.mp3" },
    "fraud-ai-5": { src: "/audio/bfsi/fraud/ava/5.mp3" },
    "fraud-ai-6": { src: "/audio/bfsi/fraud/ava/6.mp3" },
    "fraud-ai-7": { src: "/audio/bfsi/fraud/ava/7.mp3" },
    "fraud-ai-8": { src: "/audio/bfsi/fraud/ava/8.mp3" },
    // "Card status: BLOCKED — suspected fraud." — a backend action, not dialogue.
    "fraud-system-1": { src: DING },
    "fraud-ai-9": { src: "/audio/bfsi/fraud/ava/9.mp3" },
    "fraud-ai-10": { src: "/audio/bfsi/fraud/ava/10.mp3" },
    "fraud-ai-11": { src: "/audio/bfsi/fraud/ava/11.mp3" },
    "fraud-agent-1": { src: "/audio/bfsi/fraud/jordan/1.mp3" },
    "fraud-agent-2": { src: "/audio/bfsi/fraud/jordan/2.mp3" },
    // "Reviewing recent access and security changes…" — same idea, a system cue.
    "fraud-system-2": { src: DING },
    "fraud-agent-3": { src: "/audio/bfsi/fraud/jordan/3.mp3" },
    "fraud-agent-4": { src: "/audio/bfsi/fraud/jordan/4.mp3" },
    "fraud-agent-5": { src: "/audio/bfsi/fraud/jordan/5.mp3" },
    "fraud-agent-6": { src: "/audio/bfsi/fraud/jordan/6.mp3" },
    "fraud-agent-7": { src: "/audio/bfsi/fraud/jordan/7.mp3" },
  },
  collections: {
    "collections-ai-1": { src: "/audio/bfsi/collection/ava/1.mp3" },
    "collections-ai-2": { src: "/audio/bfsi/collection/ava/2.mp3" },
    "collections-ai-3": { src: "/audio/bfsi/collection/ava/3.mp3" },
    "collections-ai-4": { src: "/audio/bfsi/collection/ava/4.mp3" },
    "collections-ai-5": { src: "/audio/bfsi/collection/ava/5.mp3" },
    "collections-ai-6": { src: "/audio/bfsi/collection/ava/6.mp3" },
    "collections-ai-7": { src: "/audio/bfsi/collection/ava/7.mp3" },
    "collections-ai-8": { src: "/audio/bfsi/collection/ava/8.mp3" },
  },
}
