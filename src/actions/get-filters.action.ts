"use server";

import { createAdminClient } from "@/utils/supabase/admin";

export interface DashboardFilters {
  device: { deviceId: string; name: string }[];
  deviceType: { deviceTypeId: string; name: string }[];
  reader: { readerId: string; name: string }[];
  minDate: Date;
  maxDate: Date;
}

export async function getFilters(): Promise<DashboardFilters> {
  const supabase = createAdminClient();

  const [
    { data: devices },
    { data: deviceTypes },
    { data: readers },
    { data: oldest },
    { data: newest },
  ] = await Promise.all([
    supabase.from("devices").select("device_id, device_name").order("device_name"),
    supabase.from("device_types").select("device_type_id, device_type_name").order("device_type_name"),
    supabase.from("readers").select("reader_id, reader_name").order("reader_name"),
    supabase
      .from("tracking_logs")
      .select("event_timestamp")
      .order("event_timestamp", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("tracking_logs")
      .select("event_timestamp")
      .order("event_timestamp", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    device: (devices ?? []).map((d) => ({ deviceId: d.device_id, name: d.device_name })),
    deviceType: (deviceTypes ?? []).map((t) => ({ deviceTypeId: t.device_type_id, name: t.device_type_name })),
    reader: (readers ?? []).map((r) => ({ readerId: r.reader_id, name: r.reader_name })),
    minDate: oldest?.event_timestamp ? new Date(oldest.event_timestamp) : new Date(),
    maxDate: newest?.event_timestamp ? new Date(newest.event_timestamp) : new Date(),
  };
}
