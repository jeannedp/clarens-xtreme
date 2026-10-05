import { SETTING_FIELDS, type SettingField } from "@/constants";

export type SettingFormResult =
  | { ok: true; settingName: string; values: Record<SettingField, number> }
  | { ok: false; error: "setting_name" | SettingField };

/**
 * Reads and validates the profile name and numeric settings shared by the
 * create and update settings forms. Numbers must be whole and >= 0.
 */
export function parseSettingForm(formData: FormData): SettingFormResult {
  const settingName = String(formData.get("setting_name") ?? "").trim();
  if (!settingName) {
    return { ok: false, error: "setting_name" };
  }

  const values = {} as Record<SettingField, number>;
  for (const { name } of SETTING_FIELDS) {
    const raw = String(formData.get(name) ?? "").trim();
    const n = Number(raw);
    if (raw === "" || !Number.isInteger(n) || n < 0) {
      return { ok: false, error: name };
    }
    values[name] = n;
  }

  return { ok: true, settingName, values };
}

/** Escapes LIKE wildcards so a name can be matched case-insensitively with ilike. */
export function likeLiteral(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}
