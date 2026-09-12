"use server";

import {
  CardTotals,
  DashboardData,
  PerDayCount,
  PerGearCount,
  SessionLogRow,
} from "@/models/dto/dashboard.dto";
import { createAdminClient } from "@/utils/supabase/admin";
import { siteDayEndUtc, siteDayStartUtc } from "@/lib/time";

const PAGE_SIZE = 1000;

export interface GetDashboardArgs {
  from: string;
  to: string;
  /** Device ids to scope to. Applies to totals, rides-per-gear, and session logs. */
  deviceIds?: string[];
  /** Device type ids to scope to. Applies to totals, rides-per-gear, and session logs. */
  deviceTypeIds?: string[];
  /** Reader ids to scope to. Applies to totals and session logs (rides-per-gear/day have no reader dimension). */
  readerIds?: string[];
}

export async function getDashboard(args: GetDashboardArgs): Promise<DashboardData> {
  const supabase = createAdminClient();

  const fromUtc = siteDayStartUtc(args.from).toISOString();
  const toUtc = siteDayEndUtc(args.to).toISOString();

  // Heartbeats/unknowns are exact counts (PostgREST computes count=exact
  // server-side regardless of the response row cap), not a fetch-then-count
  // over potentially thousands of rows.
  let heartbeatCountQuery = supabase
    .from("card_totals_logs")
    .select("*", { count: "exact", head: true })
    .eq("is_heartbeat", true)
    .gte("event_timestamp", fromUtc)
    .lte("event_timestamp", toUtc);
  if (args.deviceIds?.length) heartbeatCountQuery = heartbeatCountQuery.in("device_id", args.deviceIds);
  if (args.deviceTypeIds?.length) heartbeatCountQuery = heartbeatCountQuery.in("device_type_id", args.deviceTypeIds);
  if (args.readerIds?.length) heartbeatCountQuery = heartbeatCountQuery.in("reader_id", args.readerIds);

  let unknownCountQuery = supabase
    .from("card_totals_logs")
    .select("*", { count: "exact", head: true })
    .eq("is_unknown", true)
    .gte("event_timestamp", fromUtc)
    .lte("event_timestamp", toUtc);
  if (args.deviceIds?.length) unknownCountQuery = unknownCountQuery.in("device_id", args.deviceIds);
  if (args.deviceTypeIds?.length) unknownCountQuery = unknownCountQuery.in("device_type_id", args.deviceTypeIds);
  if (args.readerIds?.length) unknownCountQuery = unknownCountQuery.in("reader_id", args.readerIds);

  let perGearQuery = supabase
    .from("rides_per_gear")
    .select("device_id, device_name, rides")
    .gte("ride_day", args.from)
    .lte("ride_day", args.to);
  if (args.deviceIds?.length) perGearQuery = perGearQuery.in("device_id", args.deviceIds);
  if (args.deviceTypeIds?.length) perGearQuery = perGearQuery.in("device_type_id", args.deviceTypeIds);

  const [
    { count: totalHeartbeats },
    { count: totalUnknown },
    { data: perGearData },
    { data: perDayData },
    sessionLogData,
  ] = await Promise.all([
    heartbeatCountQuery,
    unknownCountQuery,
    perGearQuery,
    // rides_per_day has no device/reader dimension; only the date range applies.
    supabase
      .from("rides_per_day")
      .select("ride_day, rides")
      .gte("ride_day", args.from)
      .lte("ride_day", args.to),
    // Raw per-ping rows, so a busy range can easily exceed the response
    // row cap — fetch it page by page.
    fetchAllRows((from, to) => {
      let query = supabase
        .from("session_logs")
        .select(
          "device_id, device_name, reader_id, reader_name, signal_strength, session_start, session_end, server_start, server_end",
          { count: "exact" },
        )
        .gte("session_start", fromUtc)
        .lte("session_start", toUtc);
      if (args.deviceIds?.length) query = query.in("device_id", args.deviceIds);
      if (args.deviceTypeIds?.length) query = query.in("device_type_id", args.deviceTypeIds);
      if (args.readerIds?.length) query = query.in("reader_id", args.readerIds);
      return query.order("session_start", { ascending: false }).range(from, to);
    }),
  ]);

  // --- rides per gear ------------------------------------------------------
  // rides_per_gear is grouped by day so it can be filtered by range; sum the
  // days back together per gear here. View columns are nullable per Postgres
  // convention, but device_id/device_name/rides are never actually null.
  // Also the source of totalSessions/totalGear below: it's grouped down to
  // (device, day) already, so it never needs pagination like session_logs
  // does, and summing/counting it is exact.
  const perGearMap = new Map<string, PerGearCount>();
  let totalSessions = 0;
  for (const row of perGearData ?? []) {
    totalSessions += row.rides ?? 0;
    if (!row.device_id) continue;
    const existing = perGearMap.get(row.device_id);
    if (existing) {
      existing.rides += row.rides ?? 0;
    } else {
      perGearMap.set(row.device_id, {
        deviceId: row.device_id,
        label: row.device_name ?? row.device_id,
        rides: row.rides ?? 0,
      });
    }
  }
  const perGear = [...perGearMap.values()].sort(
    (a, b) => b.rides - a.rides || a.label.localeCompare(b.label),
  );

  const totals: CardTotals = {
    totalSessions,
    totalGear: perGear.length,
    totalHeartbeats: totalHeartbeats ?? 0,
    totalUnknown: totalUnknown ?? 0,
  };

  // --- rides per day ---------------------------------------------------------
  const perDayMap = new Map((perDayData ?? []).map((row) => [row.ride_day, row.rides]));
  const perDay: PerDayCount[] = eachDay(args.from, args.to).map((day) => ({
    day,
    rides: perDayMap.get(day) ?? 0,
  }));

  // --- session logs ----------------------------------------------------------
  // session_logs is one row per raw tracking log, with the session's bounds
  // repeated on every row in that session. Collapse to one row per session,
  // counting the raw rows and averaging their signal strength. View columns
  // are nullable per Postgres convention, but only signal_strength can
  // genuinely be null (average_signal_strength is optional on tracking_logs).
  const sessionMap = new Map<string, SessionLogRow & { signalTotal: number }>();
  for (const row of sessionLogData) {
    const deviceName = row.device_name ?? "";
    const readerName = row.reader_name ?? "";
    const sessionStart = row.session_start ?? "";
    const sessionEnd = row.session_end ?? "";
    const key = `${deviceName}|${readerName}|${sessionStart}|${sessionEnd}`;
    const existing = sessionMap.get(key);
    if (existing) {
      existing.readCount += 1;
      existing.signalTotal += row.signal_strength ?? 0;
      existing.signalStrength = existing.signalTotal / existing.readCount;
    } else {
      sessionMap.set(key, {
        deviceName,
        readerName,
        signalStrength: row.signal_strength,
        sessionStart,
        sessionEnd,
        serverStart: row.server_start ?? "",
        serverEnd: row.server_end ?? "",
        readCount: 1,
        signalTotal: row.signal_strength ?? 0,
      });
    }
  }
  const sessionLogs: SessionLogRow[] = [...sessionMap.values()]
    .map(({ signalTotal: _signalTotal, ...row }) => row)
    .sort((a, b) => b.sessionStart.localeCompare(a.sessionStart));

  return {
    range: { from: args.from, to: args.to },
    totals,
    perGear,
    perDay,
    sessionLogs,
  };
}

/**
 * Fetches every row of a query by paging through `.range()`, since a single
 * request's response is capped (Supabase's hosted default is 1000 rows)
 * regardless of how many rows actually match. Adapts to whatever the real
 * per-page cap is rather than assuming PAGE_SIZE, using the exact `count`
 * PostgREST returns alongside the first page.
 */
async function fetchAllRows<T>(
  page: (from: number, to: number) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
    count: number | null;
  }>,
): Promise<T[]> {
  const rows: T[] = [];
  let offset = 0;
  let total: number | null = null;

  for (;;) {
    const { data, error, count } = await page(offset, offset + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);

    const batch = data ?? [];
    rows.push(...batch);
    if (total === null) total = count;
    offset += batch.length;

    if (batch.length === 0 || (total !== null && offset >= total)) break;
  }

  return rows;
}

/** Inclusive list of calendar days (`YYYY-MM-DD`) between `from` and `to`. */
function eachDay(from: string, to: string): string[] {
  const days: string[] = [];
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  for (let t = start.getTime(); t <= end.getTime(); t += 86_400_000) {
    days.push(new Date(t).toISOString().slice(0, 10));
  }
  return days;
}
