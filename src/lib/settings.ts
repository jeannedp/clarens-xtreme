/**
 * Calibration knobs stored in the `app_setting` table. The `ride_pass` view and
 * the `reader_status` view read these at query time, so a change takes effect on
 * the next dashboard load — no redeploy. Tune them during on-site commissioning
 * (brief §3, milestone M4).
 */
export const SETTINGS = [
  {
    key: "session_gap_minutes",
    label: "Session gap (minutes)",
    help: "A hat absent longer than this ends a ride. A reappearance after the gap is a new ride.",
    min: 1,
    max: 240,
    default: 15,
  },
  {
    key: "min_reads_per_pass",
    label: "Minimum reads per ride",
    help: "Sessions with fewer reads than this are dropped as phantoms.",
    min: 1,
    max: 100,
    default: 1,
  },
  {
    key: "min_pass_seconds",
    label: "Minimum ride duration (seconds)",
    help: "Sessions shorter than this are dropped as phantoms. 0 disables.",
    min: 0,
    max: 3600,
    default: 0,
  },
  {
    key: "heartbeat_stale_minutes",
    label: "Heartbeat stale after (minutes)",
    help: "A reader with no heartbeat for this long is shown offline.",
    min: 1,
    max: 240,
    default: 15,
  },
] as const;

export type SettingKey = (typeof SETTINGS)[number]["key"];

export type SettingsValues = Record<SettingKey, number>;

export function defaultSettings(): SettingsValues {
  return Object.fromEntries(SETTINGS.map((s) => [s.key, s.default])) as SettingsValues;
}
