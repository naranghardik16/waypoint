import { resend } from "@/lib/resend"

export async function sendEmail({
  to,
  subject,
  body,
}: {
  to: string
  subject: string
  body: string
}) {
  const { data, error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: [to],
    subject,
    text: body,
  })

  // The Resend SDK doesn't throw on an API error - it returns { data, error }.
  // Throw here so the run marks this step failed instead of succeeding silently.
  if (error) throw new Error(error.message)

  return { id: data.id }
}
