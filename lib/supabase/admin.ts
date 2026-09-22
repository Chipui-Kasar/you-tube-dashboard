import { createClient } from "@supabase/supabase-js"

export async function createAdminClient() {
  // Use SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the integration
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase environment variables. Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your environment variables in the Vars section.",
    )
  }

  // Deliberately not cookie-backed: this must always authenticate as the
  // service role, regardless of any signed-in user's session in the request.
  // A cookie-backed (@supabase/ssr) client here would pick up the caller's
  // own session and silently downgrade every query to that user's RLS
  // permissions instead of bypassing RLS.
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
