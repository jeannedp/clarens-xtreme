"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DASHBOARD_COOKIE } from "@/lib/auth";

export async function logout() {
  const store = await cookies();
  store.delete(DASHBOARD_COOKIE);
  redirect("/login");
}
