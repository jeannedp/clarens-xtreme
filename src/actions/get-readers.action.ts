"use server";

import { createAdminClient } from "@/utils/supabase/admin";

export interface Reader {
  readerId: string;
  readerName: string;
  heartbeatEpc: string;
  isActive: boolean;
  settingId: string | null;
  settingName: string | null;
}

export async function getReaders(): Promise<Reader[]> {
  const supabase = createAdminClient();
  const { data: readers, error } = await supabase
    .from("readers")
    .select("*, settings(setting_name)")
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
    settingId: r.setting_id,
    settingName: r.settings?.setting_name ?? null,
  }));
}
