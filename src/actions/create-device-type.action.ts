"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";

export async function createDeviceType(formData: FormData) {
  const deviceTypeName = String(formData.get("device_type_name") ?? "").trim();

  if (!deviceTypeName) {
    redirect("/device-types?typeError=required");
  }

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("device_types")
    .select("device_type_id")
    .ilike("device_type_name", deviceTypeName.replace(/[\\%_]/g, "\\$&"))
    .limit(1);

  if (existing && existing.length > 0) {
    redirect("/device-types?typeError=exists");
  }

  const { error } = await supabase
    .from("device_types")
    .insert({ device_type_name: deviceTypeName });

  if (error) {
    console.error("createDeviceType: insert failed", error);
    redirect("/device-types?typeError=save");
  }

  redirect("/device-types?typeSaved=1");
}
