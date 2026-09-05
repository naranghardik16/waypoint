import type { Stagehand } from "@browserbasehq/stagehand"

export async function act({
  stagehand,
  instruction,
}: {
  stagehand: Stagehand
  instruction: string
}) {
  const page = await stagehand.browser.context.activePage()
  if (!page) throw new Error("No active browser page")

  const { data } = await stagehand.act(instruction)

  // act() can resolve before a click-triggered client-side navigation lands,
  // so the URL read right after it is still the pre-click one. Settle first.
  try {
    await page.waitForLoadState("load", 10_000)
  } catch {
    // Best effort - fall through with whatever URL is current.
  }

  return {
    success: data.success,
    message: data.message,
    url: await page.url(),
  }
}
