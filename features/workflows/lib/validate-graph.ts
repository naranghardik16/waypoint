import toposort from "toposort"

import { nodeRegistry } from "@/features/workflows/nodes/node-registry"
import type { WorkflowGraph } from "@/lib/db/schema"

export function validateGraph({ nodes, edges }: WorkflowGraph): string[] {

    const problems: string[] = []

    const triggers = nodes.filter((n) => n.data.kind === "trigger").length

    if (triggers !== 1) {
        problems.push(`A workflow needs exactly one Start trigger (found ${triggers}).`)
    }

    if (edges.length === 0) {
        problems.push("Connect your nodes before running the workflow.")
    } else {
        try {
            toposort(edges.map((e) => [e.source, e.target]))
        } catch {
            problems.push("Workflow has a cycle. Please check your connections. Remove the loop before running the workflow")
        }
    }

    // Only nodes that touch an edge actually run, so only their required
    // fields can block a run. An unfilled field crashes deep inside the node's
    // executor at run time (e.g. Stagehand's page.goto) with a much less
    // useful error, so catch it here instead.
    const connected = new Set(edges.flatMap((e) => [e.source, e.target]))
    for (const node of nodes) {
        if (!connected.has(node.id)) continue
        const def = nodeRegistry[node.data.type]
        for (const field of def.fields) {
            if (field.required && !node.data.values[field.key]?.trim()) {
                problems.push(`${node.data.title} is missing ${field.label}.`)
            }
        }
    }

    return problems
}