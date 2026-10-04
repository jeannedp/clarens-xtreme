"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { Tables } from "@/models/types/database.types";

export type Device = Tables<"devices"> & { device_type_name: string };
export type DeviceType = Tables<"device_types">;

export async function getDevices(): Promise<Device[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("devices")
    .select("*, device_types(device_type_name)")
    .order("is_active", { ascending: false })
    .order("device_name");

  if (error) {
    console.error("getDevices:", error);
    return [];
  }

  return data.map(({ device_types, ...device }) => ({
    ...device,
    device_type_name: device_types?.device_type_name ?? "",
  }));
}

export async function getDeviceTypes(): Promise<DeviceType[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("device_types")
    .select("*")
    .order("is_active", { ascending: false })
    .order("device_type_name");

  if (error) {
    console.error("getDeviceTypes:", error);
    return [];
  }

  return data;
}
