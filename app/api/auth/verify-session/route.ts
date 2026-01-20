import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("admin_session")

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const session = JSON.parse(sessionCookie.value)
    return NextResponse.json({ authenticated: true, user: session })
  } catch (error) {
    console.error("[v0] Session verification error:", error)
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}
