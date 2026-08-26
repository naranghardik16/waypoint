import { NextResponse } from "next/server"

import { auth, clerkClient } from "@clerk/nextjs/server"

export async function POST(request: Request) {
  const { userId, orgId } = await auth()
  if (!userId || !orgId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { userIds } = await request.json()
  if (!Array.isArray(userIds) || userIds.some((id) => typeof id !== "string")) {
    return new Response("Invalid request body", { status: 400 })
  }

  if (userIds.length === 0) {
    return NextResponse.json([])
  }

  const client = await clerkClient()
  const { data: users } = await client.users.getUserList({
    userId: userIds,
    limit: userIds.length,
  })

  const usersById = new Map(users.map((user) => [user.id, user]))

  const results = userIds.map((id) => {
    const user = usersById.get(id)
    if (!user) return null

    return {
      name: user.fullName ?? user.username ?? "Anonymous",
      avatar: user.imageUrl,
    }
  })

  return NextResponse.json(results)
}
