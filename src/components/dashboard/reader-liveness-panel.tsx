"use client"

import * as React from "react"
import { ChevronDownIcon, RadioTowerIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  ReaderLiveness,
  READER_LIVENESS_STATUS_DOT,
  readerLivenessStatusOf,
  type ReaderLivenessStatus,
} from "@/components/dashboard/reader-liveness"
import type { ReaderLiveness as ReaderLivenessEntry } from "@/actions/get-reader-liveness.action"

export function ReaderLivenessPanel({
  readers,
  staleAfterMinutes,
  offlineAfterMinutes,
}: {
  readers: ReaderLivenessEntry[]
  staleAfterMinutes: number
  offlineAfterMinutes: number
}) {
  const [open, setOpen] = React.useState(false)

  const counts: Record<ReaderLivenessStatus, number> = { red: 0, yellow: 0, green: 0 }
  const now = Date.now()
  for (const r of readers) {
    counts[readerLivenessStatusOf(r.lastSeenAt, now, staleAfterMinutes, offlineAfterMinutes)] += 1
  }

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
        {readers.length ? (
          readers.map((r) => (
            <ReaderLiveness
              key={r.readerId}
              reader={r}
              staleAfterMinutes={staleAfterMinutes}
              offlineAfterMinutes={offlineAfterMinutes}
            />
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

const STATUS_LABEL: Record<ReaderLivenessStatus, string> = {
  green: "online",
  yellow: "stale",
  red: "offline",
}

function StatusCount({ status, count }: { status: ReaderLivenessStatus; count: number }) {
  return (
    <span className="flex items-center gap-1 text-muted-foreground">
      <span className={cn("inline-block size-2 rounded-full", READER_LIVENESS_STATUS_DOT[status])} aria-hidden />
      {count} <span className="hidden sm:inline">({STATUS_LABEL[status]})</span>
    </span>
  )
}
