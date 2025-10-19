import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createAdminClient()
    const body = await request.json()
    const id = params.id

    const { data, error } = await supabase
      .from("channels")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Error updating channel:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update channel" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createAdminClient()
    const id = params.id

    const { error } = await supabase.from("channels").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting channel:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete channel" },
      { status: 500 },
    )
  }
}
