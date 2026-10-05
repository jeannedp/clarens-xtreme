"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import { likeLiteral, parseSettingForm } from "@/lib/setting-form";

export async function updateSettings(formData: FormData) {
  const settingId = String(formData.get("setting_id") ?? "");
  const back = `/settings?id=${encodeURIComponent(settingId)}`;

  if (!settingId) {
    redirect("/settings?error=save");
  }

  const form = parseSettingForm(formData);
  if (!form.ok) {
    redirect(`${back}&error=${form.error}`);
  }

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("settings")
    .select("setting_id")
    .ilike("setting_name", likeLiteral(form.settingName))
    .neq("setting_id", settingId)
    .limit(1);

  if (existing && existing.length > 0) {
    redirect(`${back}&error=exists`);
  }

  const { error } = await supabase
    .from("settings")
    .update({
      setting_name: form.settingName,
      ...form.values,
      updated_at: new Date().toISOString(),
    })
    .eq("setting_id", settingId);

  if (error) {
    console.error("updateSettings: update failed", error);
    redirect(`${back}&error=save`);
  }

  redirect(`${back}&saved=1`);
}
