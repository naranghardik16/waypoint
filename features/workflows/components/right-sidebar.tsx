"use client"

import { useRealtimeRun } from "@trigger.dev/react-hooks"
import { PlayIcon } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { runWorkflowAction } from "@/features/workflows/actions"
import type { helloWorldTask } from "@/trigger/example"

export function RightSidebar() {
  const [isPending, startTransition] = useTransition()
  const [handle, setHandle] = useState<{
    id: string
    publicAccessToken: string
  } | null>(null)

  const { run, error } = useRealtimeRun<typeof helloWorldTask>(handle?.id, {
    accessToken: handle?.publicAccessToken,
    enabled: !!handle,
    skipColumns: ["payload"],
  })

  function handleRun() {
    startTransition(async () => {
      try {
        const result = await runWorkflowAction()
        setHandle({ id: result.id, publicAccessToken: result.publicAccessToken })
      } catch {
        toast.error("Failed to start workflow run")
      }
    })
  }

  const isRunning = isPending || (run && !["COMPLETED", "FAILED", "CANCELED", "CRASHED", "SYSTEM_FAILURE", "TIMED_OUT", "INTERRUPTED"].includes(run.status))

  return (
    <div className="flex size-full flex-col items-center justify-center gap-3">
      <Button onClick={handleRun} disabled={!!isRunning}>
        <PlayIcon />
        {isRunning ? "Running..." : "Run"}
      </Button>
      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
      {run && !error && (
        <p className="text-sm text-muted-foreground">
          {run.status === "COMPLETED"
            ? `Done: ${run.output?.message ?? "Task finished"}`
            : `Status: ${run.status}`}
        </p>
      )}
    </div>
  )
}
