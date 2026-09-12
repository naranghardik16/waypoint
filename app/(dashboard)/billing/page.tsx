import { redirect } from "next/navigation"

import { auth } from "@clerk/nextjs/server"
import { PricingTable } from "@clerk/nextjs"

export default async function BillingPage() {
  const { orgId } = await auth.protect()
  if (!orgId) redirect("/")

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-8">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold">Plans for your organization</h1>
        <p className="text-muted-foreground">
          Choose the plan that fits your organization&apos;s workflows.
        </p>
      </div>
      <PricingTable for="organization" />
    </div>
  )
}
