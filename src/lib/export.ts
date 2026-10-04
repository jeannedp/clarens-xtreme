import { DashboardData } from "@/models/dto/dashboard.dto";
import { siteClockOf, siteDayOf } from "@/lib/time";

export interface SessionExportRow {
  device: string;
  reader: string;
  date: string;
  time: string;
  sessionEnd: string;
  signal: number | null;
  reads: number;
}

export interface SummaryExportRow {
  device: string;
  date: string;
  sessions: number;
}

/** One row per completed session (device, reader, when, signal, read count). */
export function sessionExportRows(dash: DashboardData): SessionExportRow[] {
  return dash.sessionLogs
    .map((s) => ({
      device: s.deviceName,
      reader: s.readerName,
      date: siteDayOf(s.sessionStart),
      time: siteClockOf(s.sessionStart),
      sessionEnd: `${siteDayOf(s.sessionEnd)} ${siteClockOf(s.sessionEnd)}`,
      signal: s.signalStrength,
      reads: s.readCount,
    }))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

/** Per device, per day session counts. Rows with at least one session. */
export function summaryExportRows(dash: DashboardData): SummaryExportRow[] {
  const counts = new Map<string, SummaryExportRow>();
  for (const s of dash.sessionLogs) {
    const date = siteDayOf(s.sessionStart);
    const key = `${s.deviceName}-${date}`;
    const row = counts.get(key);
    if (row) {
      row.sessions += 1;
    } else {
      counts.set(key, { device: s.deviceName, date, sessions: 1 });
    }
  }
  return [...counts.values()].sort(
    (a, b) => a.device.localeCompare(b.device) || a.date.localeCompare(b.date),
  );
}

/** RFC-4180 CSV. `\r\n` line endings; fields quoted when they contain a delimiter, quote or newline. */
export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map((r) => r.map(escape).join(",")).join("\r\n");
}
