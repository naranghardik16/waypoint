import toposort from "toposort"
import { logger, metadata, task } from "@trigger.dev/sdk"
import { browserbase, Stagehand } from "@browserbasehq/stagehand"
import { nodeExecutors } from "@/features/workflows/nodes/node-executors"
import { getWorkflow } from "@/features/workflows/data"
import { interpolate, type NodeOutputs } from "@/features/workflows/lib/interpolate"

export type RunStep = {
  id: string
  status: "pending" | "running" | "done" | "failed"
}

// The Trigger.dev task the Run button fires. It loads the saved graph, works out
// what order the nodes should run in, and walks them. For now each node just
// announces itself — real execution (per-node executors, live progress, browser
// sessions) gets layered on from here.
export const runWorkflowTask = task({
  id: "run-workflow",
  run: async ({ workflowId, orgId }: { workflowId: string; orgId: string }) => {
    const workflow = await getWorkflow(orgId, workflowId)
    if (!workflow?.graph) throw new Error(`Workflow ${workflowId} has no graph`)

    const { nodes, edges } = workflow.graph
    const byId = new Map(nodes.map((n) => [n.id, n]))

    // Run only connected nodes — anything touching an edge. Orphans dropped on
    // the canvas are skipped. toposort orders them and throws on a cycle.
    const connected = new Set(edges.flatMap((e) => [e.source, e.target]))
    const order = toposort
      .array(
        nodes.map((n) => n.id),
        edges.map((e) => [e.source, e.target])
      )
      .filter((id) => connected.has(id))

    logger.log(`Running workflow ${workflow.name}`, { steps: order.length })

    const steps: RunStep[] = order.map((id) => ({ id, status: "pending" }))
    metadata.set("steps", steps)

    // The run owns one Browserbase session, opened lazily on the first browser step
    // and reused by every later one, so the recording spans the whole flow. The
    // LLM routes through Browserbase's Model Gateway (BROWSERBASE_API_KEY), so no
    // separate provider key is needed.
    let browser: Awaited<ReturnType<typeof browserbase.launch>> | undefined
    let stagehand: Stagehand | undefined
    const getStagehand = async () => {
      if (stagehand) return stagehand
      browser = await browserbase.launch({
        apiKey: process.env.BROWSERBASE_API_KEY!,
      })
      stagehand = await Stagehand.create({
        browser,
        model: {
          modelName: "google/gemini-2.5-flash",
          apiKey: process.env.BROWSERBASE_API_KEY!,
        },
        // Stagehand logging can pull in backends that fail inside trigger.dev's
        // bundled worker output — turn it off for this minimal environment.
        logging: { level: "off" },
      })
      return stagehand
    }

    const outputs: NodeOutputs = {}

    try {
      for (const step of steps) {
        const node = byId.get(step.id)!
        logger.log(`Running step: ${node.data.title}`)

        step.status = "running"
        metadata.set("steps", steps)
        await metadata.flush()

        try {
          const executor = nodeExecutors[node.data.type]
          if (executor) {
            const values = Object.fromEntries(
              Object.entries(node.data.values).map(([key, value]) => [
                key,
                interpolate(value, outputs),
              ])
            )
            outputs[step.id] = await executor({ values, getStagehand })
          }
        } catch (error) {
          step.status = "failed"
          metadata.set("steps", steps)
          await metadata.flush()
          throw error
        }

        step.status = "done"
        metadata.set("steps", steps)
      }
    } finally {
      await stagehand?.close()
      await browser?.close()
    }

    return { steps }
  },
})
