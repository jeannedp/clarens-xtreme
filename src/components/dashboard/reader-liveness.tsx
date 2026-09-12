"use client"

import { format } from "date-fns"

import { cn } from "@/lib/utils"
import type { ReaderLiveness as ReaderLivenessEntry } from "@/actions/get-reader-liveness.action"

const ONE_HOUR_MS = 60 * 60 * 1000
const ONE_DAY_MS = 24 * ONE_HOUR_MS

export type ReaderLivenessStatus = "red" | "yellow" | "green"

export const READER_LIVENESS_STATUS_DOT: Record<ReaderLivenessStatus, string> = {
  red: "bg-red-500",
  yellow: "bg-yellow-500",
  green: "bg-green-500",
}

export function readerLivenessStatusOf(lastSeenAt: string | null, now: number): ReaderLivenessStatus {
  if (!lastSeenAt) return "red"
  const age = now - new Date(lastSeenAt).getTime()
  if (age > ONE_DAY_MS) return "red"
  if (age > ONE_HOUR_MS) return "yellow"
  return "green"
}

export function ReaderLiveness({ reader }: { reader: ReaderLivenessEntry }) {
  const status = readerLivenessStatusOf(reader.lastSeenAt, Date.now())

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
