"use client"

import { useEffect } from "react"
import { useCameraPreview } from "@/hooks/use-camera-preview"
import { ScanFace } from "./icons"

const HOLD_MS = 2600

/**
 * A full-panel Face ID overlay: requests the camera, shows the live preview
 * once it actually opens, holds it for a couple of seconds, then calls
 * `onDone`. Nothing "verifies" until the camera has genuinely opened --
 * critical for a booth demo where staff need to see the permission prompt
 * actually get accepted, not a scan that completes on its own.
 */
export function FaceIdPanel({ onDone }: { onDone: () => void }) {
  const { videoRef, status } = useCameraPreview()

  useEffect(() => {
    if (status !== "ready") return
    const t = setTimeout(onDone, HOLD_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-background/97 px-6 backdrop-blur-sm">
      <div className="relative flex size-32 items-center justify-center overflow-hidden rounded-full bg-muted">
        {status === "ready" ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="size-full scale-150 object-cover transform-[scaleX(-1)]"
          />
        ) : (
          <ScanFace className="size-10 text-muted-foreground" />
        )}
        <span className={cnRing(status)} />
      </div>

      <div className="text-center">
        <div className="text-sm font-semibold text-foreground">
          {status === "loading" && "Requesting camera access…"}
          {status === "ready" && "Scanning your face…"}
          {status === "unavailable" && "Camera unavailable"}
        </div>
        <p className="mt-1 max-w-55 text-xs text-muted-foreground">
          {status === "loading" &&
            "Allow camera access in the prompt to continue."}
          {status === "ready" && "Hold still for a moment."}
          {status === "unavailable" &&
            "No camera found, or access was denied."}
        </p>
      </div>

      {status === "unavailable" && (
        <button
          onClick={onDone}
          className="rounded-lg bg-brand-navy px-4 py-2 text-xs font-bold tracking-wide text-white uppercase transition-colors hover:bg-brand-navy/85 dark:bg-brand-teal dark:text-brand-navy dark:hover:bg-brand-teal/85"
        >
          Continue without camera
        </button>
      )}
    </div>
  )
}

function cnRing(status: "loading" | "ready" | "unavailable") {
  const base = "pointer-events-none absolute inset-0 rounded-full ring-2"
  if (status === "ready") return `${base} ring-brand-teal animate-pulse`
  if (status === "loading") return `${base} ring-brand-teal/40 animate-pulse`
  return `${base} ring-border`
}
