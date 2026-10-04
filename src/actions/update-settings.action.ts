"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import { TablesUpdate } from "@/models/types/database.types";
import { SETTING_FIELDS } from "@/constants";

export async function updateSettings(formData: FormData) {
  const settingId = String(formData.get("setting_id") ?? "");
  const settingName = String(formData.get("setting_name") ?? "").trim();
  const back = `/settings?id=${encodeURIComponent(settingId)}`;

  if (!settingId) {
    redirect("/settings?error=save");
  }

  if (!settingName) {
    redirect(`${back}&error=setting_name`);
  }

  const update: TablesUpdate<"settings"> = {
    setting_name: settingName,
    updated_at: new Date().toISOString(),
  };

  for (const { name } of SETTING_FIELDS) {
    const raw = String(formData.get(name) ?? "").trim();
    const n = Number(raw);
    if (raw === "" || !Number.isInteger(n) || n < 0) {
      redirect(`${back}&error=${name}`);
    }
    update[name] = n;
  }

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("settings")
    .select("setting_id")
    .ilike("setting_name", settingName.replace(/[\\%_]/g, "\\$&"))
    .neq("setting_id", settingId)
    .limit(1);

  if (existing && existing.length > 0) {
    redirect(`${back}&error=exists`);
  }

  const { error } = await supabase
    .from("settings")
    .update(update)
    .eq("setting_id", settingId);

  if (error) {
    console.error("updateSettings: update failed", error);
    redirect(`${back}&error=save`);
  }

  redirect(`${back}&saved=1`);
}
