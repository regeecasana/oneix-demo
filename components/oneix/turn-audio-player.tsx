"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"
import type { AudioClip } from "@/lib/oneix/types"

/** Minimum time the typing indicator stays visible before a clip starts playing.
 * Without this, an already-cached clip can fire `playing` almost instantly,
 * so the indicator gets set and cleared within the same paint — the bubble and
 * audio appear to pop in with no typing beat at all. */
const MIN_TYPING_MS = 750

export interface TurnAudioPlayerHandle {
  /** Stops whatever clip is currently playing and jumps straight to
   * `onComplete`, as if every clip in the batch had finished normally. */
  skip: () => void
}

/**
 * Plays one or more clips back-to-back for the current turn/batch. Renders
 * nothing — it's a pure playback controller the chat widget mounts (keyed by
 * turn id) whenever the pending turn has a mapped clip.
 *
 * Playback (and therefore the bubble reveal) is held for `MIN_TYPING_MS` after
 * mount, so the typing indicator always gets a real, visible beat — text and
 * audio then start together, never instantly on click.
 *
 * `onStart` fires once, right as the first clip begins playing — that's the
 * moment the widget hides the typing indicator and reveals the bubble(s).
 * `onComplete` fires once every clip has finished (or failed to play, e.g. a
 * blocked autoplay policy, or the customer skipped it), which is when the
 * widget advances to the next turn.
 */
export const TurnAudioPlayer = forwardRef<TurnAudioPlayerHandle, {
  clips: AudioClip[]
  onStart: () => void
  onComplete: () => void
}>(function TurnAudioPlayer({ clips, onStart, onComplete }, ref) {
  const onStartRef = useRef(onStart)
  const onCompleteRef = useRef(onComplete)
  const currentRef = useRef<HTMLAudioElement | null>(null)
  const skipRef = useRef<() => void>(() => {})
  onStartRef.current = onStart
  onCompleteRef.current = onComplete

  useImperativeHandle(ref, () => ({ skip: () => skipRef.current() }), [])

  useEffect(() => {
    let cancelled = false
    let started = false
    let done = false

    const reveal = () => {
      if (started || cancelled) return
      started = true
      onStartRef.current()
    }

    const finish = () => {
      if (done || cancelled) return
      done = true
      reveal()
      onCompleteRef.current()
    }

    const playAt = (i: number) => {
      if (cancelled) return
      if (i >= clips.length) {
        finish()
        return
      }
      const audio = new Audio(clips[i].src)
      currentRef.current = audio
      audio.addEventListener("playing", reveal, { once: true })
      audio.addEventListener("ended", () => playAt(i + 1))
      audio.addEventListener("error", () => playAt(i + 1))
      audio.play().catch(() => playAt(i + 1))
    }

    skipRef.current = () => {
      currentRef.current?.pause()
      currentRef.current = null
      finish()
    }

    const startTimer = setTimeout(() => {
      if (!cancelled) playAt(0)
    }, MIN_TYPING_MS)

    return () => {
      cancelled = true
      clearTimeout(startTimer)
      currentRef.current?.pause()
      currentRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clips])

  return null
})
