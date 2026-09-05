import { BaseTable } from "./base.table";

export interface Device extends BaseTable {
  device_id: string;
  device_name: string;
  heartbeat_id: string;
  password: string;
}
