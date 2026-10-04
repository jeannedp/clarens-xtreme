"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";

export async function updateReader(formData: FormData) {
  const readerId = String(formData.get("reader_id") ?? "");
  const readerName = String(formData.get("reader_name") ?? "").trim();

  if (!readerId) {
    redirect("/readers?nameError=save");
  }

  if (!readerName) {
    redirect("/readers?nameError=required");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("readers")
    .update({ reader_name: readerName })
    .eq("reader_id", readerId);

  if (error) {
    console.error("updateReader: update failed", error);
    redirect("/readers?nameError=save");
  }

  redirect("/readers?nameSaved=1");
}
