"use server";

import { createAdminClient } from "@/utils/supabase/admin";

export interface Reader {
  readerId: string;
  readerName: string;
  heartbeatEpc: string;
  isActive: boolean;
}

export async function getReaders(): Promise<Reader[]> {
  const supabase = createAdminClient();
  const { data: readers, error } = await supabase
    .from("readers")
    .select("*")
    .order("is_active", { ascending: false })
    .order("reader_name");

  if (error) {
    console.error("getReaders:", error);
    return [];
  }

  return readers.map(r => ({
    readerId: r.reader_id,
    readerName: r.reader_name,
    heartbeatEpc: r.heartbeat_epc,
    isActive: r.is_active,
  }));
}
