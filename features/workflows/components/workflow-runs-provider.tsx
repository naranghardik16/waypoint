"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"
import { useRealtimeRunsWithTag } from "@trigger.dev/react-hooks"

import type { runWorkflowTask, RunStep } from "@/features/workflows/tasks/run-workflow"

type WorkflowRun = ReturnType<
  typeof useRealtimeRunsWithTag<typeof runWorkflowTask>
>["runs"][number]

const WorkflowRunsContext = createContext<WorkflowRun[] | undefined>(undefined)

// One realtime subscription per workflow, shared by every canvas component
// that needs to know how a run is progressing (node status, live indicator).
export function WorkflowRunsProvider({
  workflowId,
  publicAccessToken,
  children,
}: {
  workflowId: string
  publicAccessToken: string
  children: ReactNode
}) {
  const { runs } = useRealtimeRunsWithTag<typeof runWorkflowTask>(
    `workflow:${workflowId}`,
    { accessToken: publicAccessToken }
  )

  return (
    <WorkflowRunsContext.Provider value={runs}>
      {children}
    </WorkflowRunsContext.Provider>
  )
}

export function useLatestRunSteps(): { steps: RunStep[]; isLive: boolean } {
  const runs = useContext(WorkflowRunsContext)
  if (runs === undefined) {
    throw new Error("useLatestRunSteps must be used within a WorkflowRunsProvider")
  }

  return useMemo(() => {
    const latest = runs.reduce<WorkflowRun | undefined>((newest, run) => {
      if (!newest || run.createdAt > newest.createdAt) return run
      return newest
    }, undefined)

    if (!latest) return { steps: [], isLive: false }

    const steps = latest.output?.steps ?? (latest.metadata?.steps as RunStep[] | undefined) ?? []

    return { steps, isLive: latest.isQueued || latest.isExecuting }
  }, [runs])
}
