import { auth, currentUser } from "@clerk/nextjs/server"

import { liveblocks } from "@/lib/liveblocks"

export async function POST() {
  const { userId, orgId } = await auth()
  if (!userId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const user = await currentUser()

  // Groups the user into their Clerk organization so room `groupsAccesses`
  // keyed by orgId (see workflows/[id]/page.tsx) can grant access.
  const { status, body } = await liveblocks.identifyUser(
    {
      userId,
      groupIds: orgId ? [orgId] : [],
      organizationId: orgId ?? undefined,
    },
    {
      userInfo: {
        name: user?.fullName ?? user?.username ?? "Anonymous",
        avatar: user?.imageUrl,
      },
    }
  )

  return new Response(body, { status })
}
