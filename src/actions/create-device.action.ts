"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";

export async function createDevice(formData: FormData) {
  const deviceId = String(formData.get("device_id") ?? "").trim();
  const deviceName = String(formData.get("device_name") ?? "").trim();
  const deviceTypeId = String(formData.get("device_type_id") ?? "").trim();

  if (!deviceId || !deviceName || !deviceTypeId) {
    redirect("/devices?error=required");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("devices")
    .insert({
      device_id: deviceId,
      device_name: deviceName,
      device_type_id: deviceTypeId,
    });

  if (error) {
    console.error("createDevice: insert failed", error);
    redirect(`/devices?error=${error.code === "23505" ? "exists" : "save"}`);
  }

  redirect("/devices?saved=1");
}
