"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { getSetting } from "@/actions/get-settings.action";

export interface ReaderLiveness {
  readerId: string;
  name: string;
  lastSeenAt: string | null;
}

export interface ReaderLivenessResult {
  readers: ReaderLiveness[];
  staleAfterMinutes: number;
  offlineAfterMinutes: number;
}

const DEFAULT_STALE_MINUTES = 60;
const DEFAULT_OFFLINE_MINUTES = 24 * 60;

export async function getReaderLiveness(settingId: string): Promise<ReaderLivenessResult> {
  const supabase = createAdminClient();

  const [{ data: readers }, setting] = await Promise.all([
    supabase.from("readers").select("reader_id, reader_name").eq("setting_id", settingId).order("reader_name"),
    getSetting(settingId),
  ]);

  const readerLiveness = await Promise.all(
    (readers ?? []).map(async (r) => {
      const { data: latest } = await supabase
        .from("tracking_logs")
        .select("received_at")
        .eq("reader_id", r.reader_id)
        .order("received_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        readerId: r.reader_id,
        name: r.reader_name,
        lastSeenAt: latest?.received_at ?? null,
      };
    }),
  );

  return {
    readers: readerLiveness,
    staleAfterMinutes: setting?.heartbeatStale ?? DEFAULT_STALE_MINUTES,
    offlineAfterMinutes: setting?.heartbeatOffline ?? DEFAULT_OFFLINE_MINUTES,
  };
}
