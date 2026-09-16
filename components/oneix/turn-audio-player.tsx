"use client"

import { useEffect, useRef } from "react"
import type { AudioClip } from "@/lib/oneix/types"

/**
 * Plays one or more clips back-to-back for the current turn/batch. Renders
 * nothing — it's a pure playback controller the chat widget mounts (keyed by
 * turn id) whenever the pending turn has a mapped clip.
 *
 * `onStart` fires once, right as the first clip begins playing — that's the
 * moment the widget hides the typing indicator and reveals the bubble(s).
 * `onComplete` fires once every clip has finished (or failed to play, e.g. a
 * blocked autoplay policy), which is when the widget advances to the next turn.
 */
export function TurnAudioPlayer({
  clips,
  onStart,
  onComplete,
}: {
  clips: AudioClip[]
  onStart: () => void
  onComplete: () => void
}) {
  const onStartRef = useRef(onStart)
  const onCompleteRef = useRef(onComplete)
  onStartRef.current = onStart
  onCompleteRef.current = onComplete

  useEffect(() => {
    let cancelled = false
    let started = false
    let current: HTMLAudioElement | null = null

    const reveal = () => {
      if (started || cancelled) return
      started = true
      onStartRef.current()
    }

    const playAt = (i: number) => {
      if (cancelled) return
      if (i >= clips.length) {
        reveal()
        onCompleteRef.current()
        return
      }
      const audio = new Audio(clips[i].src)
      current = audio
      audio.addEventListener("playing", reveal, { once: true })
      audio.addEventListener("ended", () => playAt(i + 1))
      audio.addEventListener("error", () => playAt(i + 1))
      audio.play().catch(() => playAt(i + 1))
    }

    playAt(0)

    return () => {
      cancelled = true
      current?.pause()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clips])

  return null
}
