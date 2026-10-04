"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";

export async function setReaderActive(formData: FormData) {
  const readerId = String(formData.get("reader_id") ?? "");
  const isActive = formData.get("is_active") === "true";

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("readers")
    .update({ is_active: isActive })
    .eq("reader_id", readerId);

  if (error) {
    console.error("setReaderActive: update failed", error);
    redirect("/readers?error=save");
  }

  redirect("/readers");
}
