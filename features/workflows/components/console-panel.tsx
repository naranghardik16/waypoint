"use client"

import { useState } from "react"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

import { InspectorPanel } from "@/features/workflows/components/inspector-panel"
import { LogsPanel, type SelectedStep } from "@/features/workflows/components/logs-panel"
import { useWorkflowRuns } from "@/features/workflows/components/workflow-runs-provider"

// The panel mounted below the canvas. Owns which step is selected — clicking a
// step selects it, clicking the same one again deselects — and hands the runs
// and selection down to LogsPanel, while InspectorPanel shows that step's result.
export function ConsolePanel() {
  const runs = useWorkflowRuns()
  const [selected, setSelected] = useState<SelectedStep>(null)

  const selectStep = (runId: string, stepId: string) => {
    setSelected((prev) =>
      prev && prev.runId === runId && prev.stepId === stepId ? null : { runId, stepId }
    )
  }

  const selectedStep = selected
    ? runs
        .find((run) => run.id === selected.runId)
        ?.steps.find((step) => step.id === selected.stepId)
    : undefined

  return (
    <ResizablePanelGroup orientation="horizontal" className="size-full overflow-hidden">
      <ResizablePanel minSize="16rem">
        <LogsPanel runs={runs} selected={selected} onSelectStep={selectStep} />
      </ResizablePanel>
      {selectedStep && (
        <>
          <ResizableHandle />
          <ResizablePanel defaultSize="20rem" minSize="14rem" maxSize="32rem">
            <InspectorPanel step={selectedStep} />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}
