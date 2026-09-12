"use server";

import { createAdminClient } from "@/utils/supabase/admin";

export interface ReaderLiveness {
  readerId: string;
  name: string;
  /** received_at of this reader's most recent tracking log (heartbeat or gear), or null if it has never logged anything. */
  lastSeenAt: string | null;
}

export async function getReaderLiveness(): Promise<ReaderLiveness[]> {
  const supabase = createAdminClient();

  const { data: readers } = await supabase
    .from("readers")
    .select("reader_id, reader_name")
    .order("reader_name");

  return Promise.all(
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
}
