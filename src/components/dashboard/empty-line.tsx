import { FerrisWheelIcon, Loader2Icon } from "lucide-react"

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

export function EmptyLine({ loading }: { loading: boolean }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {loading ? <Loader2Icon className="animate-spin" /> : <FerrisWheelIcon />}
        </EmptyMedia>
        <EmptyTitle>{loading ? "Loading…" : "No sessions in this range"}</EmptyTitle>
        <EmptyDescription>
          {loading
            ? "Fetching session data for the selected range."
            : "Sessions will appear here once a device is tracked by a reader in this range."}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
