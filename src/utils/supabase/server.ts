import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export type CookieStoreType = Awaited<ReturnType<typeof cookies>>;

export function createClient(cookieStore: CookieStoreType) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(c => cookieStore.set(c.name, c.value, c.options));
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        }
      }
    }
  );
}
