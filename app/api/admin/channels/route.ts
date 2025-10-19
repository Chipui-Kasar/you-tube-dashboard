import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const body = await request.json()

    const { data, error } = await supabase.from("channels").insert([body]).select()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Error creating channel:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create channel" },
      { status: 500 },
    )
  }
}
