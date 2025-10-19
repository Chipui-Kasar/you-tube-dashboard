import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createAdminClient() {
  const cookieStore = await cookies()

  // Use SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the integration
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase environment variables. Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your environment variables in the Vars section.",
    )
  }

  return createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  })
}
