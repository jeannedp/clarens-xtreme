"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import { TablesUpdate } from "@/models/types/database.types";

/**
 * Updates whichever of device_type_name / is_active is present in the form,
 * so the same action handles both renaming and enabling/disabling.
 */
export async function updateDeviceType(formData: FormData) {
  const deviceTypeId = String(formData.get("device_type_id") ?? "");
  const nameField = formData.get("device_type_name");
  const activeField = formData.get("is_active");

  const update: TablesUpdate<"device_types"> = {};

  if (nameField !== null) {
    const deviceTypeName = String(nameField).trim();
    if (!deviceTypeName) {
      redirect("/devices?typeError=required");
    }
    update.device_type_name = deviceTypeName;
  }

  if (activeField !== null) {
    update.is_active = activeField === "true";
  }

  if (!deviceTypeId || Object.keys(update).length === 0) {
    redirect("/devices?typeError=save");
  }

  const supabase = createAdminClient();

  if (update.device_type_name) {
    const { data: existing } = await supabase
      .from("device_types")
      .select("device_type_id")
      .ilike("device_type_name", update.device_type_name.replace(/[\\%_]/g, "\\$&"))
      .neq("device_type_id", deviceTypeId)
      .limit(1);

    if (existing && existing.length > 0) {
      redirect("/devices?typeError=exists");
    }
  }

  const { error } = await supabase
    .from("device_types")
    .update(update)
    .eq("device_type_id", deviceTypeId);

  if (error) {
    console.error("updateDeviceType: update failed", error);
    redirect("/devices?typeError=save");
  }

  redirect(nameField !== null ? "/devices?typeSaved=1" : "/devices");
}
