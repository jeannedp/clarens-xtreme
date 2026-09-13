"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { getSettings, type Settings } from "@/actions/get-settings.action";

export interface ReaderLiveness {
  readerId: string;
  name: string;
  /** received_at of this reader's most recent tracking log (heartbeat or gear), or null if it has never logged anything. */
  lastSeenAt: string | null;
}

export interface ReaderLivenessResult {
  readers: ReaderLiveness[];
  /** From the "Heartbeat Stale" config (minutes), across all config groups. */
  staleAfterMinutes: number;
  /** From the "Heartbeat Offline" config (minutes), across all config groups. */
  offlineAfterMinutes: number;
}

const DEFAULT_STALE_MINUTES = 60;
const DEFAULT_OFFLINE_MINUTES = 24 * 60;

/** Configs aren't scoped to a single group here, so search every group for the name. */
function findConfigMinutes(settings: Settings, configName: string, fallback: number): number {
  for (const group of Object.values(settings)) {
    const value = group[configName]?.value;
    if (typeof value === "number") return value;
  }
  return fallback;
}

export async function getReaderLiveness(): Promise<ReaderLivenessResult> {
  const supabase = createAdminClient();

  const [{ data: readers }, settings] = await Promise.all([
    supabase.from("readers").select("reader_id, reader_name").order("reader_name"),
    getSettings(),
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
    staleAfterMinutes: findConfigMinutes(settings, "Heartbeat Stale", DEFAULT_STALE_MINUTES),
    offlineAfterMinutes: findConfigMinutes(settings, "Heartbeat Offline", DEFAULT_OFFLINE_MINUTES),
  };
}
