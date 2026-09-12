"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  DASHBOARD_COOKIE,
  SESSION_MAX_AGE,
  passcodeMatches,
  sessionToken,
} from "@/lib/auth";

export async function login(formData: FormData) {
  const passcode = String(formData.get("passcode") ?? "");

  if (!passcodeMatches(passcode)) {
    redirect("/login?error=passcode");
  }

  const token = await sessionToken();
  if (!token) {
    redirect("/login?error=config");
  }

  const store = await cookies();
  store.set(DASHBOARD_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  redirect('/dashboard');
}
