"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"

export type ProPlanStatus = {
  isPro: boolean
  isLoaded: boolean
  upgrade: () => void
}

// Whether the active org is on the "pro" plan, plus a redirect to the org
// billing page for components that want to gate a feature and prompt an
// upgrade.
export function useProPlan(): ProPlanStatus {
  const { isLoaded, has } = useAuth()
  const router = useRouter()

  const upgrade = useCallback(() => {
    router.push("/billing")
  }, [router])

  return {
    isPro: has?.({ plan: "pro" }) ?? false,
    isLoaded,
    upgrade,
  }
}
