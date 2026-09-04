import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export function createClient(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(c => request.cookies.set(c.name, c.value));

          supabaseResponse = NextResponse.next({
            request
          });

          cookiesToSet.forEach(c => {
            supabaseResponse.cookies.set(c.name, c.value, c.options);
          });
        }
      }
    }
  );

  return supabaseResponse;
}
