import { auth } from "@clerk/nextjs/server"
import Browserbase, { NotFoundError } from "@browserbasehq/sdk"

// Proxies a session's HLS replay playlist through the secret Browserbase API
// key. The recording lags the session close, so a still-processing replay
// surfaces as a 202 the caller is expected to poll past — see
// features/workflows/components/session-replay.tsx.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { userId, orgId } = await auth()
  if (!userId || !orgId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { sessionId } = await params
  const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY! })

  let replay
  try {
    replay = await bb.sessions.replays.retrieve(sessionId)
  } catch (error) {
    if (error instanceof NotFoundError) {
      return Response.json({ status: "pending" }, { status: 202 })
    }
    throw error
  }

  // A session records one active tab at a time; take its playlist.
  const [page] = replay.pages
  if (!page) {
    return Response.json({ status: "pending" }, { status: 202 })
  }

  const playlist = await bb.sessions.replays.retrievePage(sessionId, page.pageId)

  return new Response(playlist.body, {
    headers: {
      "Content-Type": playlist.headers.get("content-type") ?? "application/vnd.apple.mpegurl",
    },
  })
}
