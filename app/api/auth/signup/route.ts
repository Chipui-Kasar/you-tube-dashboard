import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Signup route called")

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[v0] Missing Supabase environment variables")
      return NextResponse.json(
        {
          error:
            "Server configuration error: Missing Supabase environment variables. Please add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your environment variables.",
        },
        { status: 500 },
      )
    }

    const body = await request.json()
    const { email, password, fullName } = body

    console.log("[v0] Creating admin user:", email)

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

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

    console.log("[v0] Adding user to admin_users table...")
    const { v4: uuidv4 } = await import("uuid")
    const userId = uuidv4()

    const { data, error: adminError } = await supabase
      .from("admin_users")
      .insert([
        {
          id: userId,
          email,
          password_hash: hashedPassword,
          full_name: fullName || email,
          is_active: true,
        },
      ])
      .select()

    if (adminError) {
      console.error("[v0] Error creating admin user:", adminError)
      return NextResponse.json({ error: `Failed to create admin user: ${adminError.message}` }, { status: 500 })
    }

    console.log("[v0] Admin user created successfully:", email)
    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      user: data?.[0],
    })
  } catch (error) {
    console.error("[v0] Signup error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Signup failed" }, { status: 500 })
  }
}
