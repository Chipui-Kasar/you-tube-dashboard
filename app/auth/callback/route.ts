import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(`${origin}/admin/login?error=auth_failed`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user?.email) {
    return NextResponse.redirect(`${origin}/admin/login?error=auth_failed`)
  }

  const adminClient = await createAdminClient()
  const { data: adminUser } = await adminClient
    .from("admin_users")
    .select("id")
    .eq("email", data.user.email)
    .eq("is_active", true)
    .maybeSingle()

  if (!adminUser) {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/admin/login?error=unauthorized`)
  }

  await adminClient.auth.admin.updateUserById(data.user.id, {
    app_metadata: { is_admin: true },
  })

  return NextResponse.redirect(`${origin}/admin`)
}
