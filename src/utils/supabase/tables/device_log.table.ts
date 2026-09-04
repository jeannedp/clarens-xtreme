import { BaseTable } from "./base.table";

export interface DeviceLog extends BaseTable {
  device_id: string;
  reader_id: string;

  singal_strength: number;
  last_seen_time: string;
}