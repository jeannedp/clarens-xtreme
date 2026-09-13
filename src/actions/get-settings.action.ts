"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { Json } from "@/models/types/database.types";

export interface ConfigEntry {
  value: Json;
  description: string;
}

/** `{ "<config type name>": { "<config name>": { value, description } } }` */
export type Settings = Record<string, Record<string, ConfigEntry>>;

export async function getSettings(): Promise<Settings> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("settings").select("settings").single();

  if (error) {
    console.error("getSettings:", error);
    return {};
  }

  return (data?.settings as Settings | null) ?? {};
}
