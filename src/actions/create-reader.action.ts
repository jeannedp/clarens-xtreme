"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";

export async function createReader(formData: FormData) {
  const readerId = String(formData.get("reader_id") ?? "").trim();
  const readerName = String(formData.get("reader_name") ?? "").trim();
  const heartbeatEpc = String(formData.get("heartbeat_epc") ?? "").trim();

  if (!readerId || !readerName || !heartbeatEpc) {
    redirect("/readers?error=required");
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("readers").insert({
    reader_id: readerId,
    reader_name: readerName,
    heartbeat_epc: heartbeatEpc,
  });

  if (error) {
    console.error("createReader: insert failed", error);
    // 23505 = unique_violation (reader_id already exists)
    redirect(`/readers?error=${error.code === "23505" ? "exists" : "save"}`);
  }

  redirect("/readers?saved=1");
}
