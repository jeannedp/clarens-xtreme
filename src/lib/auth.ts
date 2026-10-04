import { APP_TITLE, COOKIE_NAME, SESSION_MAX_AGE } from "@/constants";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function createSession(): Promise<boolean> {
  const token = await sessionToken();
  if (!token) {
    console.log('Authorization values not configured: "DASHBOARD_PASSCODE"');
    return false;
  }

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return true;
}

export async function isValidSession(request: NextRequest): Promise<boolean> {
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (!cookie) {
    console.log('No cookie found for current session');
    return false;
  }
  
  const token = await sessionToken();
  if (!token) {
    console.log('Authorization values not configured: "DASHBOARD_PASSCODE"');
    return false;
  }
  
  if (cookie.length !== token.length || cookie !== token) {
    console.log('Invalid cookie for current user session');
    return false;
  }

  return true;
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

export function isApiAuthorized(request: NextRequest): boolean {
  const appUsername = process.env.INGEST_BASIC_AUTH_USER;
  const appPassword = process.env.INGEST_BASIC_AUTH_PASS;
  if (!appUsername || !appPassword) {
    console.log('Authorization values not configured');
    return false;
  }

  const header = request.headers.get("authorization") ?? "";
  if (!header){
    console.log('No authorization header provided');
  }
  
  const [ method, encryptedToken ] = header.split(' ');
  if (!method || method !== 'Basic') {
    console.log('Invalid authorization method');
    return false;
  }
  
  const token = Buffer.from(encryptedToken, "base64").toString("utf8");
  const separator = token.indexOf(":");
  if (separator === -1) {
    console.log('Invalid authorization token structure');
    return false;
  }

  const [ username, password ] = token.split(':');
  return username === appUsername && password === appPassword;
}

//#region Helpers
async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sessionToken(){
  const passcode = process.env.DASHBOARD_PASSCODE!;

  if (!passcode) {
    return null;
  }

  return await sha256Hex(`${APP_TITLE}:dashboard:${passcode}`);
}
//#endregion
