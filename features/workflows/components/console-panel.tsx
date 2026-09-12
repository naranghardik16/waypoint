"use client"

import { useState } from "react"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

import { InspectorPanel } from "@/features/workflows/components/inspector-panel"
import { LogsPanel, type Selection } from "@/features/workflows/components/logs-panel"
import { useWorkflowRuns } from "@/features/workflows/components/workflow-runs-provider"

// The panel mounted below the canvas. Owns the selection — a step or a run's
// replay, never both — clicking the active one again deselects it. Hands the
// runs and selection down to LogsPanel, while InspectorPanel shows the
// selected step's result or the run's recording.
export function ConsolePanel() {
  const runs = useWorkflowRuns()
  const [selected, setSelected] = useState<Selection>(null)

  const selectStep = (runId: string, stepId: string) => {
    setSelected((prev) =>
      prev && prev.type === "step" && prev.runId === runId && prev.stepId === stepId
        ? null
        : { type: "step", runId, stepId }
    )
  }

  const selectReplay = (runId: string) => {
    setSelected((prev) =>
      prev && prev.type === "replay" && prev.runId === runId
        ? null
        : { type: "replay", runId }
    )
  }

  const selectedRun = selected ? runs.find((run) => run.id === selected.runId) : undefined

  const inspectorSelection =
    selected?.type === "step"
      ? (() => {
          const step = selectedRun?.steps.find((s) => s.id === selected.stepId)
          return step ? ({ type: "step", step } as const) : undefined
        })()
      : selected?.type === "replay" && selectedRun?.browserbaseSessionId
        ? ({ type: "replay", sessionId: selectedRun.browserbaseSessionId } as const)
        : undefined

  return (
    <ResizablePanelGroup orientation="horizontal" className="size-full overflow-hidden">
      <ResizablePanel minSize="16rem">
        <LogsPanel
          runs={runs}
          selected={selected}
          onSelectStep={selectStep}
          onSelectReplay={selectReplay}
        />
      </ResizablePanel>
      {inspectorSelection && (
        <>
          <ResizableHandle />
          <ResizablePanel defaultSize="20rem" minSize="14rem" maxSize="32rem">
            <InspectorPanel selection={inspectorSelection} />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}
