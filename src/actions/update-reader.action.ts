"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import { TablesUpdate } from "@/models/types/database.types";

/**
 * Updates whichever of reader_name / setting_id is present in the form, so
 * the same action handles renaming and moving a reader to another profile.
 * An empty setting_id unassigns the reader.
 */
export async function updateReader(formData: FormData) {
  const readerId = String(formData.get("reader_id") ?? "");
  const nameField = formData.get("reader_name");
  const settingField = formData.get("setting_id");

  const update: TablesUpdate<"readers"> = {};

  if (nameField !== null) {
    const readerName = String(nameField).trim();
    if (!readerName) {
      redirect("/readers?nameError=required");
    }
    update.reader_name = readerName;
  }

  if (settingField !== null) {
    update.setting_id = String(settingField).trim() || null;
  }

  if (!readerId || Object.keys(update).length === 0) {
    redirect("/readers?nameError=save");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("readers")
    .update(update)
    .eq("reader_id", readerId);

  if (error) {
    console.error("updateReader: update failed", error);
    redirect("/readers?nameError=save");
  }

  redirect(nameField !== null ? "/readers?nameSaved=1" : "/readers?profileSaved=1");
}
