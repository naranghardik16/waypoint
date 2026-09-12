"use client"

import { Film } from "lucide-react"

import { NodeIcon } from "@/features/workflows/components/node-icon"
import { SessionReplay } from "@/features/workflows/components/session-replay"
import type { RunStep } from "@/features/workflows/tasks/run-workflow"

export type InspectorSelection =
  | { type: "step"; step: RunStep }
  | { type: "replay"; sessionId: string }

// Shows either a step's result (output as formatted JSON, its error, or a
// short note when there's nothing to show yet) or, when a run's replay row
// is selected, that run's recording instead.
export function InspectorPanel({ selection }: { selection: InspectorSelection }) {
  if (selection.type === "replay") {
    return (
      <div className="flex size-full flex-col">
        <div className="flex items-center gap-2.5 border-b border-border px-3 py-2">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted">
            <Film className="size-3.5 text-muted-foreground" />
          </span>
          <span className="truncate text-sm font-semibold">Replay</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <SessionReplay sessionId={selection.sessionId} />
        </div>
      </div>
    )
  }

  const { step } = selection

  return (
    <div className="flex size-full flex-col">
      <div className="flex items-center gap-2.5 border-b border-border px-3 py-2">
        <NodeIcon type={step.nodeType} />
        <span className="truncate text-sm font-semibold">{step.title}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {step.error ? (
          <pre className="overflow-x-auto rounded-(--radius) border border-destructive/30 bg-destructive/10 p-2.5 text-xs whitespace-pre-wrap text-destructive">
            {step.error}
          </pre>
        ) : step.output !== undefined ? (
          <pre className="overflow-x-auto rounded-(--radius) bg-muted p-2.5 text-xs whitespace-pre-wrap">
            {JSON.stringify(step.output, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-muted-foreground">
            {step.status === "running"
              ? "Still running…"
              : step.status === "pending"
                ? "This step hasn't run yet."
                : "This step produced no output."}
          </p>
        )}
      </div>
    </div>
  )
}
