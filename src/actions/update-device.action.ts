"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";

export async function updateDevice(formData: FormData) {
  const deviceId = String(formData.get("device_id") ?? "");
  const deviceName = String(formData.get("device_name") ?? "").trim();

  if (!deviceId) {
    redirect("/devices?nameError=save");
  }

  if (!deviceName) {
    redirect("/devices?nameError=required");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("devices")
    .update({ device_name: deviceName })
    .eq("device_id", deviceId);

  if (error) {
    console.error("updateDevice: update failed", error);
    redirect("/devices?nameError=save");
  }

  redirect("/devices?nameSaved=1");
}
