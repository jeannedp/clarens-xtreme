export const DASHBOARD_COOKIE = "cx_dash";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function sessionToken(): Promise<string | null> {
  const passcode = process.env.DASHBOARD_PASSCODE;
  if (!passcode) {
    return null;
  }

  return sha256Hex(`clarens-xtreme:dashboard:${passcode}`);
}

export async function isValidSession(cookie: string | undefined): Promise<boolean> {
  if (!cookie) {
    return false;
  }

  const token = await sessionToken();
  if (!token || cookie.length !== token.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= cookie.charCodeAt(i) ^ token.charCodeAt(i);
  }

  return diff === 0;
}

export function passcodeMatches(submitted: string): boolean {
  const passcode = process.env.DASHBOARD_PASSCODE ?? "";
  if (!passcode || submitted.length !== passcode.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < passcode.length; i++) {
    diff |= submitted.charCodeAt(i) ^ passcode.charCodeAt(i);
  }

  return diff === 0;
}
