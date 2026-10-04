"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { Tables } from "@/models/types/database.types";

export interface Setting {
  settingId: string;
  settingName: string;
  sessionGap: number;
  heartbeatStale: number;
  heartbeatOffline: number;
  minSessionDuration: number;
  minSessionReads: number;
  updatedAt: string;
}

export async function getSettings(): Promise<Setting[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .order("setting_name");

  if (error) {
    console.error("getSettings:", error);
    return [];
  }

  return data.map(toSetting);
}

export async function getSetting(settingId: string): Promise<Setting | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("setting_id", settingId)
    .maybeSingle();

  if (error) {
    console.error("getSetting:", error);
    return null;
  }

  return data ? toSetting(data) : null;
}

function toSetting(s: Tables<"settings">): Setting {
  return {
    settingId: s.setting_id,
    settingName: s.setting_name,
    sessionGap: s.session_gap,
    heartbeatStale: s.heartbeat_stale,
    heartbeatOffline: s.heartbeat_offline,
    minSessionDuration: s.min_session_duration,
    minSessionReads: s.min_session_reads,
    updatedAt: s.updated_at,
  };
}
