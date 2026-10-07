"use server";

import type {
  CardTotals,
  DashboardData,
  PerDayCount,
  PerDeviceCount,
  SessionLogRow,
} from "@/models/dto/dashboard.dto";
import { getSessions } from "@/actions/get-sessions.action";
import { siteDayEndUtc, siteDayOf, siteDayStartUtc } from "@/lib/time";
import { createAdminClient } from "@/utils/supabase/admin";

export interface GetDashboardArgs {
  settingId: string;
  /** Site-local calendar day, `YYYY-MM-DD`. */
  from: string;
  /** Site-local calendar day, `YYYY-MM-DD` (inclusive). */
  to: string;
  deviceIds?: string[];
  deviceTypeIds?: string[];
  readerIds?: string[];
}

export async function getDashboard({
  settingId,
  from,
  to,
  deviceIds,
  deviceTypeIds,
  readerIds,
}: GetDashboardArgs): Promise<DashboardData> {
  const supabase = createAdminClient();
  const fromUtc = siteDayStartUtc(from).toISOString();
  const toUtc = siteDayEndUtc(to).toISOString();

  //#region Read counts
  // Reads belong to their reader's settings profile, so only the profile's
  // readers count (narrowed further by the reader filter, if any).
  const { data: profileReaders, error: readersError } = await supabase
    .from("readers")
    .select("reader_id")
    .eq("setting_id", settingId);

  if (readersError) throw new Error(readersError.message);

  const profileReaderIds = profileReaders.map((r) => r.reader_id);
  const countReaderIds =
    readerIds && readerIds.length > 0
      ? profileReaderIds.filter((id) => readerIds.includes(id))
      : profileReaderIds;

  // save-read.action.ts sets reader_epc only on heartbeats, and leaves
  // device_id null when the epc isn't a registered device. Neither kind of
  // read has a device, so only the reader scope applies to these counts.
  // Filter on received_at (server clock), not event_timestamp: the latter comes
  // from the reader's datestamp, which may be missing (null) or off.
  const heartbeatCountQuery = supabase
    .from("tracking_logs")
    .select("*", { count: "exact", head: true })
    .not("reader_epc", "is", null)
    .gte("received_at", fromUtc)
    .lte("received_at", toUtc)
    .in("reader_id", countReaderIds);

  const unknownCountQuery = supabase
    .from("tracking_logs")
    .select("*", { count: "exact", head: true })
    .is("reader_epc", null)
    .is("device_id", null)
    .gte("received_at", fromUtc)
    .lte("received_at", toUtc)
    .in("reader_id", countReaderIds);
  //#endregion

  const [heartbeats, unknown, sessions] = await Promise.all([
    heartbeatCountQuery,
    unknownCountQuery,
    getSessions({ settingId, from: fromUtc, to: toUtc, deviceIds, deviceTypeIds, readerIds }),
  ]);

  if (heartbeats.error) throw new Error(heartbeats.error.message);
  if (unknown.error) throw new Error(unknown.error.message);

  //#region Sessions per device
  const perDeviceMap = new Map<string, PerDeviceCount>();
  for (const s of sessions) {
    const existing = perDeviceMap.get(s.deviceId);
    if (existing) {
      existing.sessions += 1;
    } else {
      perDeviceMap.set(s.deviceId, { deviceId: s.deviceId, label: s.deviceName, sessions: 1 });
    }
  }
  const perDevice = [...perDeviceMap.values()].sort(
    (a, b) => b.sessions - a.sessions || a.label.localeCompare(b.label),
  );
  //#endregion

  //#region Sessions per day
  const perDayMap = new Map<string, number>();
  for (const s of sessions) {
    const day = siteDayOf(s.sessionStart);
    perDayMap.set(day, (perDayMap.get(day) ?? 0) + 1);
  }
  const perDay: PerDayCount[] = eachDay(from, to).map((day) => ({
    day,
    sessions: perDayMap.get(day) ?? 0,
  }));
  //#endregion

  const totals: CardTotals = {
    totalSessions: sessions.length,
    totalDevices: perDevice.length,
    totalHeartbeats: heartbeats.count ?? 0,
    totalUnknown: unknown.count ?? 0,
  };

  // getSessions already orders by session_start, newest first.
  const sessionLogs: SessionLogRow[] = sessions.map((s) => ({
    deviceName: s.deviceName,
    readerName: s.readerName,
    signalStrength: s.signalStrength,
    sessionStart: s.sessionStart,
    sessionEnd: s.sessionEnd,
    readCount: s.totalReads,
  }));

  return {
    range: { from, to },
    totals,
    perDevice,
    perDay,
    sessionLogs,
  };
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
