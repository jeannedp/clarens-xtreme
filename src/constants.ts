export const APP_TITLE = "Clarens Xtreme";
export const APP_DESCRIPTION = "Device Tracker";

//  Cookie
export const COOKIE_NAME = 'cx_dash';
export const APP_NAME = "clarens-xtreme";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
export const SESSION_AGE = 60 * 60 * 24 * 30; // 30 days

export const MS_PER_HOUR = 3_600_000;

export const DAY_FORMAT = "yyyy-MM-dd";

//  Settings
// Editable numeric columns of public.settings, in display order. Shared by
// the settings page (labels) and update-settings.action.ts (validation).
export const SETTING_FIELDS = [
  {
    name: "session_gap",
    label: "Session Gap",
    description: "Minutes without a read before the next read starts a new session.",
  },
  {
    name: "heartbeat_stale",
    label: "Heartbeat Stale",
    description: "Minutes since a reader was last seen before it is marked stale.",
  },
  {
    name: "heartbeat_offline",
    label: "Heartbeat Offline",
    description: "Minutes since a reader was last seen before it is marked offline.",
  },
  {
    name: "min_session_duration",
    label: "Minimum Session Duration",
    description: "Shortest a session can last, in seconds, to be counted.",
  },
  {
    name: "min_session_reads",
    label: "Minimum Session Reads",
    description: "Fewest reads a session needs to be counted.",
  },
] as const;

export type SettingField = (typeof SETTING_FIELDS)[number]["name"];
export const READER_LIVENESS_POLL_MS = 2 * 60 * 1000; // 2 minutes
