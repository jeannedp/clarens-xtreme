"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { fetchAllRows } from "@/utils/supabase/fetch-all-rows";

export interface SessionFilters {
  settingId: string;
  from: string;
  to: string;
  deviceIds?: string[];
  deviceTypeIds?: string[];
  readerIds?: string[];
}

export interface Session {
  deviceId: string;
  deviceName: string;
  readerId: string;
  readerName: string;
  sessionStart: string;
  sessionEnd: string;
  signalStrength: number;
  totalReads: number;
}

/** `from`/`to` are ISO instants; sessions must start and end within them. */
export async function getSessions(filters: SessionFilters): Promise<Session[]> {
  const supabase = createAdminClient();

  let sessions;
  try {
    sessions = await fetchAllRows((start, end) => {
      let query = supabase
        .rpc("get_sessions", { p_setting_id: filters.settingId }, { count: "exact" })
        .gte("session_start", filters.from)
        .lte("session_end", filters.to);

      if (filters.deviceIds && filters.deviceIds.length > 0) {
        query = query.in("device_id", filters.deviceIds);
      }

      if (filters.deviceTypeIds && filters.deviceTypeIds.length > 0) {
        query = query.in("device_type_id", filters.deviceTypeIds);
      }

      if (filters.readerIds && filters.readerIds.length > 0) {
        query = query.in("reader_id", filters.readerIds);
      }

      // Stable order so pages don't overlap.
      return query
        .order("session_start", { ascending: false })
        .order("device_id")
        .order("reader_id")
        .range(start, end);
    });
  } catch (error) {
    console.error("getSessions:", error);
    return [];
  }

  return sessions.map((s) => ({
    deviceId: s.device_id,
    deviceName: s.device_name,
    readerId: s.reader_id,
    readerName: s.reader_name,
    sessionStart: s.session_start,
    sessionEnd: s.session_end,
    signalStrength: s.signal_strength ?? 0,
    totalReads: s.total_reads,
  }));
}
