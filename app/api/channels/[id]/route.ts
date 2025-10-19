import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    const { data, error } = await supabase.from("channels").update(body).eq("id", params.id).select()

    if (error) {
      console.error("[v0] Supabase error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data?.[0])
  } catch (error) {
    console.error("[v0] Error updating channel:", error)
    return NextResponse.json({ error: "Failed to update channel" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("channels").delete().eq("id", params.id)

    if (error) {
      console.error("[v0] Supabase error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting channel:", error)
    return NextResponse.json({ error: "Failed to delete channel" }, { status: 500 })
  }
}
