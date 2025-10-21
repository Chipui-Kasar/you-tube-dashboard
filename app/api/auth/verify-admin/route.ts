import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {
              // Handle cookie setting errors
            }
          },
        },
      },
    )

    // Check if user is an admin
    const { data: adminUser, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email)
      .eq("is_active", true)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error verifying admin:", error)
      return NextResponse.json({ isAdmin: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ isAdmin: !!adminUser })
  } catch (error) {
    console.error("[v0] Verify admin error:", error)
    return NextResponse.json(
      { isAdmin: false, error: error instanceof Error ? error.message : "Verification failed" },
      { status: 500 },
    )
  }
}
