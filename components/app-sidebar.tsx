import { OrganizationSwitcher, UserButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"

import { createWorkflowAction } from "@/features/workflows/actions"
import { listWorkflows } from "@/features/workflows/data"
import { WorkflowNav } from "@/features/workflows/components/workflow-nav"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export async function AppSidebar() {
  const { orgId } = await auth()

  const workflows = orgId ? await listWorkflows(orgId) : []

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="flex-row items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center
      group-data-[collapsible-icon]:gap-0">
          <OrganizationSwitcher
            hidePersonal
            appearance={{
              elements: {
                rootBox: "min-w-0 flex-1 group-data-[collapsible=icon]:!hidden",
                organizationSwitcherTrigger:
                  "w-full min-w-0 justify-between rounded-md px-2 py-1.5 text-sidebar-foreground hover:bg-sidebar-accent",
              },
            }}
          />
          <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent>
        <WorkflowNav
          workflows={workflows}
          createWorkflowAction={createWorkflowAction}
        />
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:items-center">
        <UserButton
          appearance={{
            elements: {
              rootBox: "w-full",
              userButtonTrigger: "w-full justify-start group-data-[collapsible=icon]:justify-center",
              userButtonIdentifier: "group-data-[collapsible=icon]:hidden",
            },
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
