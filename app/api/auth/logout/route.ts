import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const cookieStore = await cookies()

    const response = NextResponse.json({ success: true })
    response.cookies.delete("admin_session")

    return response
  } catch (error) {
    console.error("[v0] Logout error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Logout failed" }, { status: 500 })
  }
}
