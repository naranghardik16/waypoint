export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="flex min-h-svh flex-col items-center justify-center">
      <p className="text-sm text-muted-foreground">Workflow ID: {id}</p>
    </div>
  )
}
