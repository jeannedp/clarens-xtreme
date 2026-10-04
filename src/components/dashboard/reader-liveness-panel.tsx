"use client"

import * as React from "react"
import { format } from "date-fns"
import { ChevronDownIcon, RadioTowerIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import type { ReaderLiveness } from "@/actions/get-reader-liveness.action"

type ReaderLivenessStatus = "red" | "yellow" | "green"

const STATUS_TICK_MS = 60 * 1000

const STATUS_DOT: Record<ReaderLivenessStatus, string> = {
  red: "bg-red-500",
  yellow: "bg-yellow-500",
  green: "bg-green-500",
}

const STATUS_LABEL: Record<ReaderLivenessStatus, string> = {
  green: "online",
  yellow: "stale",
  red: "offline",
}

export function ReaderLivenessPanel({
  readers,
  staleAfterMinutes,
  offlineAfterMinutes,
}: {
  readers: ReaderLiveness[]
  staleAfterMinutes: number
  offlineAfterMinutes: number
}) {
  const [open, setOpen] = React.useState(false)
  const [now, setNow] = React.useState(Date.now)

  // Re-evaluate statuses as time passes, not only when new readings arrive.
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), STATUS_TICK_MS)
    return () => clearInterval(id)
  }, [])

  const counts: Record<ReaderLivenessStatus, number> = { red: 0, yellow: 0, green: 0 }
  const entries = readers.map((reader) => {
    const status = statusOf(reader.lastSeenAt, now, staleAfterMinutes, offlineAfterMinutes)
    counts[status] += 1
    return { reader, status }
  })

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border bg-background">
      <CollapsibleTrigger className="group flex w-full items-center gap-4 px-3 py-1.5 text-[13px]">
        <span className="font-bold text-chart-2">Readers</span>
        <StatusCount status="green" count={counts.green} />
        <StatusCount status="yellow" count={counts.yellow} />
        <StatusCount status="red" count={counts.red} />
        <ChevronDownIcon className="ml-auto size-4 text-muted-foreground transition-transform group-data-open:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-row flex-wrap gap-2 px-3 pb-3">
        {entries.length ? (
          entries.map(({ reader, status }) => (
            <div
              key={reader.readerId}
              className="flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5 text-[13px]"
            >
              <StatusDot status={status} />
              <span className="font-medium">{reader.name}</span>
              <span className="text-muted-foreground">
                {reader.lastSeenAt ? `last seen ${format(new Date(reader.lastSeenAt), "MMM d, HH:mm")}` : "no reads yet"}
              </span>
            </div>
          ))
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <RadioTowerIcon />
              </EmptyMedia>
              <EmptyTitle>No readers registered</EmptyTitle>
              <EmptyDescription>Readers will appear here once they&apos;re added to the registry.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}

function StatusDot({ status }: { status: ReaderLivenessStatus }) {
  return <span className={cn("inline-block size-2 rounded-full", STATUS_DOT[status])} aria-hidden />
}

function StatusCount({ status, count }: { status: ReaderLivenessStatus; count: number }) {
  return (
    <span className="flex items-center gap-1 text-muted-foreground">
      <StatusDot status={status} />
      {count} <span className="hidden sm:inline">({STATUS_LABEL[status]})</span>
    </span>
  )
}

function statusOf(
  lastSeenAt: string | null,
  now: number,
  staleAfterMinutes: number,
  offlineAfterMinutes: number,
): ReaderLivenessStatus {
  if (!lastSeenAt) return "red"
  const ageMinutes = (now - new Date(lastSeenAt).getTime()) / 60_000
  if (ageMinutes > offlineAfterMinutes) return "red"
  if (ageMinutes > staleAfterMinutes) return "yellow"
  return "green"
}
