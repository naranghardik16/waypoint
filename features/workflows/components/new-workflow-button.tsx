"use client"

import { useTransition } from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { createWorkflowAction } from "@/features/workflows/actions"
import { generateSlug } from "@/features/workflows/lib/generate-slug"

export function NewWorkflowButton() {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          createWorkflowAction(generateSlug())
        })
      }}
    >
      <PlusIcon />
      New workflow
    </Button>
  )
}
