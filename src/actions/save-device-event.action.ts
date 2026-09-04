import { CookieStoreType, createClient } from "@/utils/supabase/server";
import { AutoEvent } from "../models/auto-event.model";
import { Tables } from "@/utils/supabase/constants";
import { Device } from "@/utils/supabase/tables/device.table";
import { DeviceLog } from "@/utils/supabase/tables/device_log.table";

export async function saveDeviceEvent(deviceEvent: AutoEvent, cookies: CookieStoreType) {
  const supabase = createClient(cookies);
  const { data: devices, success: findSuccess } = await supabase
    .from(Tables.Devices)
    .select<keyof Device, Device>('device_id')
    .eq<keyof Device>('device_id', deviceEvent.id)
   
  if (!findSuccess) {
    return findSuccess;
  }

  const { success } = await supabase
    .from(Tables.DeviceLogs)
    .insert<DeviceLog>({
      id: null!,
      created_at: null!,
      device_id: deviceEvent.id,
      last_seen_time: deviceEvent.datestamp,
      reader_id: deviceEvent.rfid,
      singal_strength: deviceEvent.rssi
    });

  return success;
}