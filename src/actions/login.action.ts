"use server";

import { createSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const passcode = String(formData.get("passcode") ?? "");
  if (process.env.DASHBOARD_PASSCODE !== passcode) {
    redirect("/login?error=passcode");
  }

  const success = await createSession();
  if (!success) {
    redirect("/login?error=config");
  }
  
  redirect('/dashboard');
}
