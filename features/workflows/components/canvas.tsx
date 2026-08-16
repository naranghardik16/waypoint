"use client"

import { useCallback, useState, useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  ReactFlow,
  ConnectionLineType,
  type ColorMode,
  type Edge,
  type Node,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react"

import "@xyflow/react/dist/style.css"

const initialNodes: Node[] = [
  { id: "n1", position: { x: 0, y: 0 }, data: { label: "Node 1" } },
  { id: "n2", position: { x: 0, y: 100 }, data: { label: "Node 2" } },
]

const initialEdges: Edge[] = [{ id: "n1-n2", source: "n1", target: "n2" }]

const emptySubscribe = () => () => {}

function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

export function Canvas() {
  const { resolvedTheme } = useTheme()
  const mounted = useMounted()
  const colorMode = (mounted ? resolvedTheme : "dark") as ColorMode
  const [nodes, setNodes] = useState<Node[]>(initialNodes)
  const [edges, setEdges] = useState<Edge[]>(initialEdges)

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((n) => applyNodeChanges(changes, n)),
    []
  )

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((e) => applyEdgeChanges(changes, e)),
    []
  )

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((e) => addEdge(params, e)),
    []
  )

  return (
    <div className="size-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        colorMode={colorMode}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: "var(--border" }}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: { stroke: "var(--border)" },
        }}

        style={
          {
            "--xy-background-color": "var(--background)",
            "--xy-edge-stroke-width": 2,
            "--xy-connectionline-stroke-width": 2,
          } as React.CSSProperties
        }
        maxZoom={1}
      >
        <Controls />
      </ReactFlow>
    </div>
  )
}
