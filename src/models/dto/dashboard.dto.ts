export interface CardTotals {
  totalSessions: number;
  totalGear: number;
  totalHeartbeats: number;
  totalUnknown: number;
}

export interface PerGearCount {
  deviceId: string;
  label: string;
  rides: number;
}

export interface PerDayCount {
  /** Calendar day, `YYYY-MM-DD`. */
  day: string;
  rides: number;
}

export interface SessionLogRow {
  deviceName: string;
  readerName: string;
  signalStrength: number | null;
  sessionStart: string;
  sessionEnd: string;
  serverStart: string;
  serverEnd: string;
  readCount: number;
}

export interface DashboardData {
  range: { from: string; to: string };
  totals: CardTotals;
  perGear: PerGearCount[];
  perDay: PerDayCount[];
  sessionLogs: SessionLogRow[];
}
