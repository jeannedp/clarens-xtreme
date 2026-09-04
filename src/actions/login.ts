import { cookies } from "next/headers";
import { createClient } from "../utils/supabase/server";

export async function login() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  // logic goes here
}