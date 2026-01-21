import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function getAuthenticatedUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
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

  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getAdminUser() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("admin_session")

    if (!sessionCookie || !sessionCookie.value) {
      console.log("[v0] No admin session cookie found")
      return null
    }

    const session = JSON.parse(sessionCookie.value)
    
    if (!session || !session.email) {
      console.log("[v0] Invalid session data")
      return null
    }

    console.log("[v0] Admin user verified:", session.email)
    return session
  } catch (error) {
    console.error("[v0] Error verifying admin user:", error)
    return null
  }
}
