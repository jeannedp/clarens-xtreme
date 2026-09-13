"use client"

import { format } from "date-fns"

import { cn } from "@/lib/utils"
import type { ReaderLiveness as ReaderLivenessEntry } from "@/actions/get-reader-liveness.action"

export type ReaderLivenessStatus = "red" | "yellow" | "green"

export const READER_LIVENESS_STATUS_DOT: Record<ReaderLivenessStatus, string> = {
  red: "bg-red-500",
  yellow: "bg-yellow-500",
  green: "bg-green-500",
}

export function readerLivenessStatusOf(
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

export function ReaderLiveness({
  reader,
  staleAfterMinutes,
  offlineAfterMinutes,
}: {
  reader: ReaderLivenessEntry
  staleAfterMinutes: number
  offlineAfterMinutes: number
}) {
  const status = readerLivenessStatusOf(reader.lastSeenAt, Date.now(), staleAfterMinutes, offlineAfterMinutes)

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5 text-[13px]">
      <span className={cn("inline-block size-2 rounded-full", READER_LIVENESS_STATUS_DOT[status])} aria-hidden />
      <span className="font-medium">{reader.name}</span>
      <span className="text-muted-foreground">
        {reader.lastSeenAt ? `last seen ${format(new Date(reader.lastSeenAt), "MMM d, HH:mm")}` : "no reads yet"}
      </span>
    </div>
  )
}
