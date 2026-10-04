"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";

export async function setDeviceActive(formData: FormData) {
  const deviceId = String(formData.get("device_id") ?? "");
  const isActive = formData.get("is_active") === "true";

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("devices")
    .update({ is_active: isActive })
    .eq("device_id", deviceId);

  if (error) {
    console.error("setDeviceActive: update failed", error);
    redirect("/devices?error=save");
  }

  redirect("/devices");
}
