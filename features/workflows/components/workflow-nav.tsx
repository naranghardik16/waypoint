"use client"

import { useTransition } from "react"
import { PlusIcon, WorkflowIcon } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import type { createWorkflowAction } from "@/features/workflows/actions"
import { generateSlug } from "@/features/workflows/lib/generate-slug"
import type { Workflow } from "@/lib/db/schema"

interface WorkflowNavProps {
  workflows: Workflow[]
  createWorkflowAction: typeof createWorkflowAction
}

export function WorkflowNav({
  workflows,
  createWorkflowAction,
}: WorkflowNavProps) {
  const { state } = useSidebar()
  const [isPending, startTransition] = useTransition()

  function handleCreateWorkflow() {
    startTransition(() => {
      createWorkflowAction(generateSlug())
    })
  }

  const workflowList = (
    <SidebarMenu className="gap-y-0.5">
      {workflows.map((workflow) => (
        <SidebarMenuItem key={workflow.id}>
          <SidebarMenuButton>
            <span>{workflow.name}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )

  if (state === "collapsed") {
    return (
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <Popover>
              <PopoverTrigger asChild>
                <SidebarMenuButton tooltip="Workflows">
                  <WorkflowIcon />
                </SidebarMenuButton>
              </PopoverTrigger>
              <PopoverContent side="right" align="start">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      disabled={isPending}
                      onClick={handleCreateWorkflow}
                    >
                      <PlusIcon />
                      <span>New workflow</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
                <SidebarSeparator />
                {workflowList}
              </PopoverContent>
            </Popover>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    )
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Workflows</SidebarGroupLabel>
      <SidebarGroupAction
        title="New workflow"
        disabled={isPending}
        onClick={handleCreateWorkflow}
      >
        <PlusIcon />
        <span className="sr-only">New workflow</span>
      </SidebarGroupAction>
      <SidebarGroupContent>{workflowList}</SidebarGroupContent>
    </SidebarGroup>
  )
}
