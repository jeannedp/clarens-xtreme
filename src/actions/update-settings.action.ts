"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import { SETTINGS } from "@/lib/settings";

export async function updateSettings(formData: FormData) {
  const updates: { key: string; value: number; updated_at: string }[] = [];
  const now = new Date().toISOString();

  for (const setting of SETTINGS) {
    const raw = String(formData.get(setting.key) ?? "").trim();
    const n = Number(raw);
    if (raw === "" || !Number.isFinite(n) || n < setting.min || n > setting.max) {
      redirect(`/dashboard/settings?error=${encodeURIComponent(setting.key)}`);
    }
    updates.push({ key: setting.key, value: n, updated_at: now });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("app_setting").upsert(updates, { onConflict: "key" });
  if (error) {
    console.error("updateSettings: upsert failed", error);
    redirect("/dashboard/settings?error=save");
  }

  redirect("/dashboard/settings?saved=1");
}
