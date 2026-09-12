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

function stepsOf(run: WorkflowRun): RunStep[] {
  return run.output?.steps ?? (run.metadata?.steps as RunStep[] | undefined) ?? []
}

// The Browserbase session recording lags the session close, so the id only
// shows up once the run has finished and produced its final output — never
// read it from live metadata.
function browserbaseSessionIdOf(run: WorkflowRun): string | undefined {
  return run.output?.browserbaseSessionId
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

    return { steps: stepsOf(latest), isLive: latest.isQueued || latest.isExecuting }
  }, [runs])
}

export type WorkflowRunWithSteps = {
  id: string
  createdAt: WorkflowRun["createdAt"]
  status: WorkflowRun["status"]
  isLive: boolean
  steps: RunStep[]
  browserbaseSessionId?: string
}

// Every run for this workflow, newest first, with its steps normalized out of
// whichever of output/metadata currently holds them — for a run history panel.
export function useWorkflowRuns(): WorkflowRunWithSteps[] {
  const runs = useContext(WorkflowRunsContext)
  if (runs === undefined) {
    throw new Error("useWorkflowRuns must be used within a WorkflowRunsProvider")
  }

  return useMemo(
    () =>
      [...runs]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((run) => ({
          id: run.id,
          createdAt: run.createdAt,
          status: run.status,
          isLive: run.isQueued || run.isExecuting,
          steps: stepsOf(run),
          browserbaseSessionId: browserbaseSessionIdOf(run),
        })),
    [runs]
  )
}
