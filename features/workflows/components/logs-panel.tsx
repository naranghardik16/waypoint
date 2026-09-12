"use client"

import prettyMs from "pretty-ms"
import { CircleAlert, CircleCheck, Film, Lock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import { NodeIcon } from "@/features/workflows/components/node-icon"
import type { WorkflowRunWithSteps } from "@/features/workflows/components/workflow-runs-provider"
import { useProPlan } from "@/features/workflows/hooks/use-pro-plan"
import type { RunStep } from "@/features/workflows/tasks/run-workflow"

// A selection is either one step within a run, or the run's replay as a
// whole — never both at once.
export type Selection =
  | { type: "step"; runId: string; stepId: string }
  | { type: "replay"; runId: string }
  | null

// Maps trigger.dev's run status strings to a Badge variant and display label.
const runStatus: Record<WorkflowRunWithSteps["status"], { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  COMPLETED: { label: "Completed", variant: "default" },
  EXECUTING: { label: "Running", variant: "secondary" },
  QUEUED: { label: "Queued", variant: "secondary" },
  DEQUEUED: { label: "Queued", variant: "secondary" },
  WAITING: { label: "Waiting", variant: "secondary" },
  DELAYED: { label: "Delayed", variant: "outline" },
  PENDING_VERSION: { label: "Pending", variant: "outline" },
  CANCELED: { label: "Canceled", variant: "outline" },
  FAILED: { label: "Failed", variant: "destructive" },
  CRASHED: { label: "Crashed", variant: "destructive" },
  SYSTEM_FAILURE: { label: "System failure", variant: "destructive" },
  TIMED_OUT: { label: "Timed out", variant: "destructive" },
  EXPIRED: { label: "Expired", variant: "destructive" },
}

// One step row: the node's icon and title, a live/failed/done indicator, and
// how long it took. Pending steps (never reached this run) look inactive.
function StepRow({
  step,
  isSelected,
  onSelect,
}: {
  step: RunStep
  isSelected: boolean
  onSelect: () => void
}) {
  const isRunning = step.status === "running"
  const isFailed = step.status === "failed"
  const isDone = step.status === "done"
  const isPending = step.status === "pending"

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-(--radius) px-2.5 py-1.5 text-left hover:bg-accent",
        isSelected && "bg-accent",
        isPending && "opacity-50"
      )}
    >
      <NodeIcon type={step.nodeType} running={isRunning} />
      <span
        className={cn(
          "flex-1 truncate text-sm font-medium",
          isFailed && "text-destructive"
        )}
      >
        {step.title}
      </span>
      {isFailed && <CircleAlert className="size-3.5 shrink-0 text-destructive" />}
      {isDone && <CircleCheck className="size-3.5 shrink-0 text-emerald-500" />}
      {step.durationMs !== undefined && (
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {prettyMs(step.durationMs)}
        </span>
      )}
    </button>
  )
}

// The row standing in for the whole run's recording, not any one step. Shown
// once a run has finished and produced a Browserbase session id.
function ReplayRow({
  isSelected,
  onSelect,
}: {
  isSelected: boolean
  onSelect: () => void
}) {
  const { isPro, upgrade } = useProPlan()

  return (
    <button
      type="button"
      onClick={isPro ? onSelect : upgrade}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-(--radius) px-2.5 py-1.5 text-left hover:bg-accent",
        isSelected && "bg-accent"
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted">
        <Film className="size-3.5 text-muted-foreground" />
      </span>
      <span className={cn("flex-1 truncate text-sm font-medium", !isPro && "text-muted-foreground")}>
        Replay
      </span>
      {!isPro && <Lock className="size-3.5 shrink-0 text-muted-foreground" />}
    </button>
  )
}

// One run: a header with when it ran and its overall status, then its steps.
function RunGroup({
  run,
  selected,
  onSelectStep,
  onSelectReplay,
}: {
  run: WorkflowRunWithSteps
  selected: Selection
  onSelectStep: (runId: string, stepId: string) => void
  onSelectReplay: (runId: string) => void
}) {
  const status = runStatus[run.status]
  const hasReplay = run.browserbaseSessionId !== undefined && !run.isLive

  return (
    <div className="flex flex-col gap-1 border-b border-border py-2 last:border-b-0">
      <div className="flex items-center gap-2 px-2.5 py-1">
        <span className="text-xs font-semibold text-muted-foreground">
          {run.createdAt.toLocaleTimeString()}
        </span>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
      <div className="flex flex-col gap-0.5">
        {run.steps.map((step) => (
          <StepRow
            key={step.id}
            step={step}
            isSelected={
              selected?.type === "step" &&
              selected.runId === run.id &&
              selected.stepId === step.id
            }
            onSelect={() => onSelectStep(run.id, step.id)}
          />
        ))}
        {hasReplay && (
          <ReplayRow
            isSelected={selected?.type === "replay" && selected.runId === run.id}
            onSelect={() => onSelectReplay(run.id)}
          />
        )}
      </div>
    </div>
  )
}

// The runs list itself: every run, newest first, each with its steps below it.
export function LogsPanel({
  runs,
  selected,
  onSelectStep,
  onSelectReplay,
}: {
  runs: WorkflowRunWithSteps[]
  selected: Selection
  onSelectStep: (runId: string, stepId: string) => void
  onSelectReplay: (runId: string) => void
}) {
  if (runs.length === 0) {
    return (
      <div className="flex size-full items-center justify-center">
        <span className="text-sm text-muted-foreground">No runs yet</span>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-1">
      {runs.map((run) => (
        <RunGroup
          key={run.id}
          run={run}
          selected={selected}
          onSelectStep={onSelectStep}
          onSelectReplay={onSelectReplay}
        />
      ))}
    </div>
  )
}
