import type { AudioClip, AudioMap, ChatTurn } from "./types"

export interface AudioBatch {
  /** All turns that reveal together once playback of the first clip starts. */
  turns: ChatTurn[]
  /** Clips in playback order (sorted by `order`), played back-to-back. */
  clips: AudioClip[]
}

/**
 * Looks up the audio clip for `script[index]` and, if it belongs to a `group`,
 * pulls in every immediately-following turn that shares that group id — that
 * consecutive run is what "sent at the same time" means here: one typing
 * indicator, all of those bubbles reveal together, their clips then play back
 * to back underneath. Returns null when the current turn has no mapped audio,
 * so the caller falls back to the timed typing simulation.
 */
export function getAudioBatch(
  map: AudioMap,
  scenarioId: string,
  script: ChatTurn[],
  index: number,
): AudioBatch | null {
  const scenarioMap = map[scenarioId]
  const first = script[index]
  const firstClip = scenarioMap?.[first.id]
  if (!scenarioMap || !firstClip) return null

  const turns: ChatTurn[] = [first]
  const clips: AudioClip[] = [firstClip]

  if (firstClip.group) {
    let i = index + 1
    while (i < script.length) {
      const turn = script[i]
      const clip = scenarioMap[turn.id]
      if (!clip || clip.group !== firstClip.group) break
      turns.push(turn)
      clips.push(clip)
      i++
    }
  }

  clips.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  return { turns, clips }
}
