"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Requests the front camera for a live, local-only preview used to simulate a
 * Face ID scan — no frame is captured, analyzed, or sent anywhere; the stream
 * just feeds a <video> element and is released the moment the caller unmounts.
 */
export function useCameraPreview() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">(
    "loading"
  )

  useEffect(() => {
    let stream: MediaStream | null = null
    let cancelled = false

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unavailable")
      return
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        stream = s
        if (videoRef.current) videoRef.current.srcObject = s
        setStatus("ready")
      })
      .catch(() => {
        if (!cancelled) setStatus("unavailable")
      })

    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return { videoRef, status }
}
