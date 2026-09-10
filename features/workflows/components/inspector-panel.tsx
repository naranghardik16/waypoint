"use client"

import { NodeIcon } from "@/features/workflows/components/node-icon"
import type { RunStep } from "@/features/workflows/tasks/run-workflow"

// Shows the selected step's result: its output as formatted JSON, its error
// if it failed, or a short note when there's nothing to show yet.
export function InspectorPanel({ step }: { step: RunStep }) {
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
