"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";

/**
 * configs is append-only: saving inserts a new row per changed config
 * rather than updating in place, so old values stay in history. The
 * settings view (public.settings) always reads the latest row per
 * (config_type_id, config_name).
 *
 * All config values are assumed to be whole numbers.
 */
export async function updateSettings(formData: FormData) {
  const configType = String(formData.get("_configType") ?? "").trim();
  const configNames = formData.getAll("_configName").map(String);

  if (!configType || configNames.length === 0) {
    redirect("/settings?error=save");
  }

  const values = new Map<string, number>();
  for (const name of configNames) {
    const raw = String(formData.get(`config:${name}`) ?? "").trim();
    const n = Number(raw);
    if (raw === "" || !Number.isInteger(n)) {
      redirect(`/settings?type=${encodeURIComponent(configType)}&error=${encodeURIComponent(name)}`);
    }
    values.set(name, n);
  }

  const supabase = createAdminClient();

  const { data: type, error: typeError } = await supabase
    .from("config_types")
    .select("config_type_id")
    .eq("config_type_name", configType)
    .maybeSingle();

  if (typeError || !type) {
    console.error("updateSettings: unknown config type", configType, typeError);
    redirect(`/settings?type=${encodeURIComponent(configType)}&error=save`);
  }

  const rows = configNames.map((name) => ({
    config_type_id: type.config_type_id,
    config_name: name,
    config_value: values.get(name)!,
    config_description: String(formData.get(`description:${name}`) ?? ""),
  }));

  const { error } = await supabase.from("configs").insert(rows);
  if (error) {
    console.error("updateSettings: insert failed", error);
    redirect(`/settings?type=${encodeURIComponent(configType)}&error=save`);
  }

  redirect(`/settings?type=${encodeURIComponent(configType)}&saved=1`);
}
