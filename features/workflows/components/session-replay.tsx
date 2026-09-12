"use client"

import { useEffect, useRef, useState } from "react"
import Hls from "hls.js"

type ReplayStatus = "loading" | "pending" | "ready" | "error"

const POLL_INTERVAL_MS = 2000
const MAX_POLL_ATTEMPTS = 30

// Polls the replay proxy route until Browserbase has finished processing the
// session's recording (it answers 202 while pending), then hands the ready
// playlist URL to hls.js. Not wired into any panel yet — this is standalone
// playback given a session id.
export function SessionReplay({ sessionId }: { sessionId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<ReplayStatus>("loading")
  const [error, setError] = useState<string | null>(null)

  const playlistUrl = `/api/replays/${sessionId}`

  useEffect(() => {
    let cancelled = false
    let attempts = 0
    let timeoutId: ReturnType<typeof setTimeout>

    const poll = async () => {
      attempts += 1

      let response: Response
      try {
        response = await fetch(playlistUrl)
      } catch {
        if (!cancelled) {
          setError("Could not reach the replay service.")
          setStatus("error")
        }
        return
      }

      if (cancelled) return

      if (response.status === 202) {
        if (attempts >= MAX_POLL_ATTEMPTS) {
          setError("The recording is taking longer than expected to process.")
          setStatus("error")
          return
        }
        setStatus("pending")
        timeoutId = setTimeout(poll, POLL_INTERVAL_MS)
        return
      }

      if (!response.ok) {
        setError(`Failed to load replay (${response.status}).`)
        setStatus("error")
        return
      }

      setStatus("ready")
    }

    poll()

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [playlistUrl])

  useEffect(() => {
    if (status !== "ready") return
    const video = videoRef.current
    if (!video) return

    if (Hls.isSupported()) {
      const hls = new Hls()
      hls.loadSource(playlistUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) setError(`Playback error: ${data.details}`)
      })
      return () => hls.destroy()
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = playlistUrl
      return
    }

    setError("HLS playback is not supported in this browser.")
  }, [status, playlistUrl])

  if (status === "loading" || status === "pending") {
    return <div>Waiting for the recording to be ready…</div>
  }

  if (status === "error") {
    return <div>{error ?? "Something went wrong."}</div>
  }

  return <video ref={videoRef} controls className="w-full" />
}
