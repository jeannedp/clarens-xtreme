"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import { likeLiteral, parseSettingForm } from "@/lib/setting-form";

export async function createSetting(formData: FormData) {
  const form = parseSettingForm(formData);
  if (!form.ok) {
    redirect(`/settings?createError=${form.error}`);
  }

  const supabase = createAdminClient();

  // setting_name has no unique constraint, so guard against duplicates here.
  const { data: existing } = await supabase
    .from("settings")
    .select("setting_id")
    .ilike("setting_name", likeLiteral(form.settingName))
    .limit(1);

  if (existing && existing.length > 0) {
    redirect("/settings?createError=exists");
  }

  const { data: created, error } = await supabase
    .from("settings")
    .insert({ setting_name: form.settingName, ...form.values })
    .select("setting_id")
    .single();

  if (error || !created) {
    console.error("createSetting: insert failed", error);
    redirect("/settings?createError=save");
  }

  redirect(`/settings?id=${encodeURIComponent(created.setting_id)}&created=1`);
}
