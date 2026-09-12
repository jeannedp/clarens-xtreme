'use client'

import * as React from "react"
import { addDays, format } from "date-fns"
import { SquareTextIcon, SheetIcon, LogsIcon, Loader2Icon } from "lucide-react"
import { type DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { RangeDatePicker } from "@/components/dashboard/range-date-picker"
import { StatCard } from "@/components/dashboard/stat-card"
import { DashboardCard } from "@/components/dashboard/dashboard-card"
import { SessionsPerGearChart } from "@/components/dashboard/sessions-per-gear-chart"
import { RidesPerDayChart } from "@/components/dashboard/rides-per-day-chart"
import { EmptyLine } from "@/components/dashboard/empty-line"
import { MultiSelectFilter } from "@/components/dashboard/multi-select-filter"
import { ReaderLivenessPanel } from "@/components/dashboard/reader-liveness-panel"
import { getDashboard } from "@/actions/get-dashboard.action"
import { getFilters } from "@/actions/get-filters.action"
import type { DashboardFilters } from "@/actions/get-filters.action"
import { getReaderLiveness } from "@/actions/get-reader-liveness.action"
import type { ReaderLiveness as ReaderLivenessEntry } from "@/actions/get-reader-liveness.action"
import { DashboardData } from "@/models/dto/dashboard.dto"

const DAY = "yyyy-MM-dd"
const READER_LIVENESS_POLL_MS = 2 * 60 * 1000

export default function DashboardPage() {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date(),
  })
  const [deviceIds, setDeviceIds] = React.useState<string[]>([])
  const [deviceTypeIds, setDeviceTypeIds] = React.useState<string[]>([])
  const [readerIds, setReaderIds] = React.useState<string[]>([])
  const [filters, setFilters] = React.useState<DashboardFilters | null>(null)
  const [readerLiveness, setReaderLiveness] = React.useState<ReaderLivenessEntry[]>([])
  const [data, setData] = React.useState<DashboardData | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const requestId = React.useRef(0)

  const pendingRange =
    date?.from && date?.to ? `${format(date.from, DAY)}..${format(date.to, DAY)}` : null
  const loadedRange = data ? `${data.range.from}..${data.range.to}` : null
  const loading = pendingRange !== null && pendingRange !== loadedRange

  React.useEffect(() => {
    getFilters().then(setFilters, (err) => console.error(err))
  }, [])

  React.useEffect(() => {
    const refresh = () => getReaderLiveness().then(setReaderLiveness, (err) => console.error(err))
    refresh()
    const id = setInterval(refresh, READER_LIVENESS_POLL_MS)
    return () => clearInterval(id)
  }, [])

  React.useEffect(() => {
    if (!date?.from || !date?.to) return

    const id = ++requestId.current
    getDashboard({
      from: format(date.from, DAY),
      to: format(date.to, DAY),
      deviceIds: deviceIds.length > 0 ? deviceIds : undefined,
      deviceTypeIds: deviceTypeIds.length > 0 ? deviceTypeIds : undefined,
      readerIds: readerIds.length > 0 ? readerIds : undefined,
    }).then(
      (result) => {
        if (id === requestId.current) {
          setData(result)
          setError(null)
        }
      },
      (err) => {
        console.error(err)
        if (id === requestId.current) setError("Could not load dashboard data.")
      },
    )
  }, [date, deviceIds, deviceTypeIds, readerIds])

  const canExport = Boolean(date?.from && date?.to)
  async function download(fmt: "csv" | "xlsx", dataset: "sessions" | "summary") {
    if (!date?.from || !date?.to) return

    try {
      const res = await fetch("/api/v1/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: fmt,
          dataset,
          from: format(date.from, DAY),
          to: format(date.to, DAY),
        }),
      })
      if (!res.ok) throw new Error(`Export failed (${res.status})`)

      const blob = await res.blob()
      const filename = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? `clarens-xtreme-export.${fmt}`

      // Content-Disposition: attachment response, not a page — download the
      // blob and hand it to the browser's downloader without navigating.
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.rel = "noopener"
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      setError("Could not export data.")
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-[960px] w-full">
      {/* Controls */}
      <div className="flex flex-col gap-4 w-full">
        <div className="flex flex-row flex-wrap gap-4 items-center justify-between">
          <RangeDatePicker date={date} onDateChange={setDate} />

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" disabled={!canExport}>Download</Button>} />
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => download("csv", "sessions")}>
                  <SquareTextIcon />
                  Session log
                  <DropdownMenuShortcut>.csv</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => download("csv", "summary")}>
                  <SquareTextIcon />
                  Per gear / day
                  <DropdownMenuShortcut>.csv</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => download("xlsx", "sessions")}>
                  <SheetIcon />
                  Excel workbook
                  <DropdownMenuShortcut>.xlsx</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-row flex-wrap gap-4 items-center">
          <MultiSelectFilter
            options={(filters?.device ?? []).map((d) => ({ value: d.deviceId, label: d.name }))}
            value={deviceIds}
            onValueChange={setDeviceIds}
            placeholder="All gear"
            aria-label="Filter by gear"
          />
          <MultiSelectFilter
            options={(filters?.deviceType ?? []).map((t) => ({ value: t.deviceTypeId, label: t.name }))}
            value={deviceTypeIds}
            onValueChange={setDeviceTypeIds}
            placeholder="All gear types"
            aria-label="Filter by gear type"
          />
          <MultiSelectFilter
            options={(filters?.reader ?? []).map((r) => ({ value: r.readerId, label: r.name }))}
            value={readerIds}
            onValueChange={setReaderIds}
            placeholder="All readers"
            aria-label="Filter by reader"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Reader liveness */}
      <ReaderLivenessPanel readers={readerLiveness} />

      {/* Headline cards */}
      <div className="flex flex-row flex-wrap gap-4 justify-between">
        <StatCard title="Total sessions" value={data?.totals.totalSessions} subtitle="Completed rides in range" loading={loading} />
        <StatCard title="Total gear" value={data?.totals.totalGear} subtitle="Distinct gear used in range" loading={loading} />
        <StatCard title="Total heartbeats" value={data?.totals.totalHeartbeats} subtitle="Reader heartbeat pings in range" loading={loading} />
        <StatCard title="Total unknown" value={data?.totals.totalUnknown} subtitle="Reads from unregistered gear or readers" loading={loading} />
      </div>

      {/* Sessions per gear / rides per day */}
      <div className="flex flex-row flex-wrap gap-4">
        <DashboardCard title="Sessions per gear" className="flex-1 min-w-[300px]">
          {data?.perGear.length ? (
            <SessionsPerGearChart data={data.perGear.map((g) => ({ label: g.label, rides: g.rides }))} />
          ) : (
            <EmptyLine loading={loading} />
          )}
        </DashboardCard>

        <DashboardCard title="Rides per day" className="flex-1 min-w-[300px]">
          {data?.perDay.length ? (
            <RidesPerDayChart data={data.perDay.map((d) => ({ label: d.day, rides: d.rides }))} />
          ) : (
            <EmptyLine loading={loading} />
          )}
        </DashboardCard>
      </div>

      {/* Session log */}
      <div className="rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden">
        <Table>
          <TableHeader className="bg-chart-2 [&_th]:font-bold [&_th]:text-white!">
            <TableRow>
              <TableHead>Gear</TableHead>
              <TableHead>Reader</TableHead>
              <TableHead>Session start</TableHead>
              <TableHead>Session end</TableHead>
              <TableHead>Signal</TableHead>
              <TableHead className="text-right">Reads</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr:nth-child(even)]:bg-muted/60">
            {data?.sessionLogs.length ? (
              data.sessionLogs.map((s, i) => (
                <TableRow key={`${s.deviceName}-${s.sessionStart}-${i}`}>
                  <TableCell>{s.deviceName}</TableCell>
                  <TableCell>{s.readerName}</TableCell>
                  <TableCell>{format(new Date(s.sessionStart), "MMM d, HH:mm")}</TableCell>
                  <TableCell>{format(new Date(s.sessionEnd), "MMM d, HH:mm")}</TableCell>
                  <TableCell>{s.signalStrength?.toFixed(1) ?? "—"}</TableCell>
                  <TableCell className="text-right">{s.readCount}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6}>
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        {loading ? <Loader2Icon className="animate-spin" /> : <LogsIcon />}
                      </EmptyMedia>
                      <EmptyTitle>{loading ? "Loading…" : "No sessions in this range"}</EmptyTitle>
                      <EmptyDescription>
                        {loading
                          ? "Fetching session data for the selected range."
                          : "Completed sessions will appear here once gear passes a reader in this range."}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
