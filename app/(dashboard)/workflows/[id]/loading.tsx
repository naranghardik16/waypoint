import { Spinner } from "@/components/ui/spinner"

export default function Loading() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center">
      <Spinner className="size-6" />
    </div>
  )
}
