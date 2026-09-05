"use client"

import { useMemo } from "react"
import { getIncomers, useStore, type Edge } from "@xyflow/react"

import { nodeRegistry, type NodeType, type StepNodeType } from "@/features/workflows/nodes/node-registry"

export type UpstreamConnection = {
  token: string
  label: string
  sourceType: NodeType
}

// Every output any node upstream of `node` produces, ready to insert as a
// {{ }} token. Walks incomers repeatedly (parents, then their parents, ...)
// rather than stopping at direct parents, and stays in sync with the graph
// since it reads nodes/edges straight from the React Flow store.
export function useUpstreamConnections(
  node: StepNodeType | undefined
): UpstreamConnection[] {
  const { nodes, edges } = useStore((s) => ({ nodes: s.nodes, edges: s.edges })) as {
    nodes: StepNodeType[]
    edges: Edge[]
  }

  return useMemo(() => {
    if (!node) return []

    const visited = new Set<string>([node.id])
    const ancestors: StepNodeType[] = []
    const queue: StepNodeType[] = [node]

    while (queue.length > 0) {
      const current = queue.shift()!
      for (const parent of getIncomers(current, nodes, edges)) {
        if (visited.has(parent.id)) continue
        visited.add(parent.id)
        ancestors.push(parent)
        queue.push(parent)
      }
    }

    return ancestors.flatMap((ancestor) =>
      nodeRegistry[ancestor.data.type].outputs.map((output) => ({
        token: `{{ ${ancestor.id}.${output.path} }}`,
        label: `${ancestor.data.title} · ${output.label}`,
        sourceType: ancestor.data.type,
      }))
    )
  }, [node, nodes, edges])
}
