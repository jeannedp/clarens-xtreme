import { createAdminClient } from "@/utils/supabase/admin";

export type SaveReadResult = {
  type:  "stored" | "heartbeat" | "unknown_reader" | "error";
  message?: string;
};

export interface SaveReadInput {
  epc: string;
  readerId: string;
  rssi: number;
  readerTimestamp: string | null;
}

export async function saveRead({ epc, readerId, readerTimestamp, rssi }: SaveReadInput): Promise<SaveReadResult> {
  const supabase = createAdminClient();

  const { data: reader, error: readerError } = await supabase
    .from("readers")
    .select("reader_id, heartbeat_epc")
    .eq("reader_id", readerId)
    .maybeSingle();

  if (readerError) {
    return { type: "error", message: readerError.message };
  }

  if (!reader) {
    return { type: "unknown_reader" };
  }

  const isHeartbeat = reader.heartbeat_epc === epc;

  // tracking_logs.device_id has a FK to devices, so an epc that isn't a
  // registered device must be stored as null rather than the raw epc value.
  let deviceId: string | null = null;
  if (!isHeartbeat) {
    const { data: device, error: deviceError } = await supabase
      .from("devices")
      .select("device_id")
      .eq("device_id", epc)
      .maybeSingle();

    if (deviceError) {
      return { type: "error", message: deviceError.message };
    }

    deviceId = device?.device_id ?? null;
  }

  const { error: insertError } = await supabase.from("tracking_logs").insert({
    device_id: deviceId,
    reader_id: reader.reader_id,
    reader_epc: isHeartbeat ? epc : null,
    average_signal_strength: rssi,
    event_timestamp: readerTimestamp,
  });

  return insertError
    ? { type: "error", message: insertError.message }
    : { type: isHeartbeat ? "heartbeat" : "stored" };
}
