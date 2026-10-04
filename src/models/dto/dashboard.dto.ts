export interface CardTotals {
  totalSessions: number;
  totalDevices: number;
  totalHeartbeats: number;
  totalUnknown: number;
}

export interface PerDeviceCount {
  deviceId: string;
  label: string;
  sessions: number;
}

export interface PerDayCount {
  /** Calendar day, `YYYY-MM-DD`. */
  day: string;
  sessions: number;
}

export interface SessionLogRow {
  deviceName: string;
  readerName: string;
  signalStrength: number | null;
  sessionStart: string;
  sessionEnd: string;
  readCount: number;
}

export interface DashboardData {
  range: { from: string; to: string };
  totals: CardTotals;
  perDevice: PerDeviceCount[];
  perDay: PerDayCount[];
  sessionLogs: SessionLogRow[];
}
