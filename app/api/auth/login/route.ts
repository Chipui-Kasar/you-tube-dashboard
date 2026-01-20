import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Login route called")

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[v0] Missing Supabase environment variables")
      return NextResponse.json(
        { error: "Server configuration error: Missing Supabase environment variables" },
        { status: 500 },
      )
    }

    const body = await request.json()
    const { email, password } = body

    console.log("[v0] Login attempt for email:", email)

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
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
    })

    const { data: adminUser, error: queryError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email)
      .eq("is_active", true)
      .maybeSingle()

    if (queryError) {
      console.error("[v0] Error querying admin user:", queryError)
      return NextResponse.json({ error: "Login failed" }, { status: 401 })
    }

    if (!adminUser) {
      console.log("[v0] Admin user not found:", email)
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const passwordMatch = await bcrypt.compare(password, adminUser.password_hash)

    if (!passwordMatch) {
      console.log("[v0] Password mismatch for user:", email)
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    console.log("[v0] Login successful for:", email)

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: adminUser.id,
        email: adminUser.email,
        full_name: adminUser.full_name,
      },
    })

    // Set secure session cookie
    response.cookies.set(
      "admin_session",
      JSON.stringify({
        id: adminUser.id,
        email: adminUser.email,
        full_name: adminUser.full_name,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      },
    )

    return response
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Login failed" }, { status: 500 })
  }
}
