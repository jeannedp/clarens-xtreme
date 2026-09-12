"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { SETTINGS, SettingsValues, defaultSettings } from "@/lib/settings";

const KNOWN = new Set<string>(SETTINGS.map((s) => s.key));

export async function getSettings(): Promise<SettingsValues> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("app_setting").select("key, value");

  const values = defaultSettings();
  for (const row of data ?? []) {
    if (!KNOWN.has(row.key)) continue;
    const n = Number(row.value);
    if (Number.isFinite(n)) {
      values[row.key as keyof SettingsValues] = n;
    }
  }
  return values;
}
