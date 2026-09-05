import type { Action, Stagehand } from "@browserbasehq/stagehand"

const MAX_STEPS = 15

function sameAction(a: Action, b: Action) {
  return (
    a.selector === b.selector &&
    a.method === b.method &&
    JSON.stringify(a.arguments) === JSON.stringify(b.arguments)
  )
}

// Grounds the progress check with the actual URL rather than trusting the
// model to read it off the page - a page can carry stale or template-static
// text (e.g. a "Login" link that renders regardless of session state) that
// reads as unfinished even once the real target page has been reached.
async function checkProgress(stagehand: Stagehand, instruction: string, url: string) {
  const { data } = await stagehand.extract(
    `You are checking progress on this task: "${instruction}". The current page ` +
      `URL is "${url}". Based on the current state of the page, has the task ` +
      `been fully completed? Reply with "yes" or "no" followed by a one-sentence ` +
      `reason.`
  )
  return data.extraction
}

// Stagehand v4 dropped agent() - there's no built-in autonomous loop, so this
// composes observe(), act(), and extract() into one: each round, observe()
// proposes candidate actions and extract() checks progress. Acting straight
// off the raw instruction (rather than an observed candidate) can get stuck
// replaying the same action forever when a page's own markup is ambiguous
// (e.g. a mislabeled form field pulls the model back to it every time).
// Skipping only the previous action isn't enough either - with a multi-field
// form it just oscillates between two already-done fields, since each one
// differs from "the last action" without ever reaching the untried one - so
// this skips every action already taken this run, not just the last one.
export async function agent({
  stagehand,
  instruction,
}: {
  stagehand: Stagehand
  instruction: string
}) {
  const page = await stagehand.browser.context.activePage()
  if (!page) throw new Error("No active browser page")

  const history: Action[] = []

  for (let step = 0; step < MAX_STEPS; step++) {
    const progress = await checkProgress(stagehand, instruction, await page.url())
    if (/^yes/i.test(progress.trim())) {
      return { success: true, completed: true, message: progress }
    }

    const { data: candidates } = await stagehand.observe(instruction)
    const next = candidates.find(
      (candidate) => !history.some((done) => sameAction(candidate, done))
    )

    if (!next) {
      // Nothing left to act on, and the progress check just said "no" - stay
      // conservative rather than guess. Treating this as success on the theory
      // that running out of actions usually means the goal was reached looked
      // reasonable, but on a page with stale UI (e.g. a "Login" link that
      // doesn't reflect the real session) observe() can exhaust the same way
      // one step before the actual target, so it isn't a safe signal either
      // way - and reporting success on the wrong page is worse than reporting
      // a failure on the right one, since it silently misleads whatever
      // downstream step trusts this output.
      return {
        success: false,
        completed: true,
        message: "No further actionable steps found for the instruction; unable to confirm it was completed.",
      }
    }

    const { data: acted } = await stagehand.act(next)
    if (!acted.success) {
      return { success: false, completed: true, message: acted.message }
    }

    history.push(next)
  }

  return {
    success: false,
    completed: false,
    message: `Gave up after ${MAX_STEPS} steps without confirming the task was done.`,
  }
}
