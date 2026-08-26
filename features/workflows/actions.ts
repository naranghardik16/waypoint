"use server"

import { auth } from "@clerk/nextjs/server"
import { tasks } from "@trigger.dev/sdk"
import { LiveblocksError } from "@liveblocks/node"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createWorkflow, deleteWorkflow } from "@/features/workflows/data"
import { liveblocks } from "@/lib/liveblocks"
import type { helloWorldTask } from "@/trigger/example"

export async function createWorkflowAction(name: string) {
  const { orgId } = await auth()

  if (!orgId) {
    throw new Error("No active organization")
  }

  const workflow = await createWorkflow(orgId, name)

  revalidatePath("/", "layout")
  redirect(`/workflows/${workflow.id}`)
}

export async function deleteWorkflowAction(id: string) {
  const { orgId } = await auth()

  if (!orgId) {
    throw new Error("No active organization")
  }

  const workflow = await deleteWorkflow(orgId, id)

  if (!workflow) {
    throw new Error("Workflow not found")
  }

  try {
    await liveblocks.deleteRoom(id)
  } catch (error) {
    // The room may never have been created (e.g. the canvas was never
    // opened), so a missing room isn't a failure.
    if (!(error instanceof LiveblocksError && error.status === 404)) {
      throw error
    }
  }

  revalidatePath("/", "layout")
  redirect("/")
}

export async function runWorkflowAction() {
  const { orgId } = await auth()

  if (!orgId) {
    throw new Error("No active organization")
  }

  const handle = await tasks.trigger<typeof helloWorldTask>("hello-world", {
    message: "Hello from right sidebar"
  })

  return handle
}
