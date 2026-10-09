import { createAdminClient } from "@/utils/supabase/admin";

export type SaveReadResult = {
  type:  "stored" | "heartbeat" | "unknown_device" | "unknown_reader" | "error";
  message: string;
};

export interface SaveReadArgs {
  epc: string;
  readerId: string;
  rssi: number;
  readerTimestamp: string | null;
}

export async function saveRead({ epc, readerId, readerTimestamp, rssi }: SaveReadArgs): Promise<SaveReadResult> {
  const supabase = createAdminClient();

  const { data: reader, error: readerError } = await supabase
    .from("readers")
    .select("reader_id, heartbeat_epc")
    .or(`reader_id.eq.${readerId},heartbeat_epc.eq.${epc}`)
    .maybeSingle();
  
  if (readerError) {
    return { type: "error", message: readerError.message };
  }

  if (!reader) {
    return { type: "unknown_reader", message: `Reader with ids "${readerId}" of "${epc}" not found in the system` };
  }
  
  const isHeartbeat = reader.heartbeat_epc === epc;
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

  if (insertError) {
    return { type: "error", message: insertError.message }
  }

  if (!isHeartbeat && deviceId === null) {
    return { type: "unknown_device", message: `Device with id "${epc}" not found in the system` };
  }

  return { 
    type: isHeartbeat ? "heartbeat" : "stored", 
    message: isHeartbeat ? "Heartbeat" : "Stored"
  };
}
