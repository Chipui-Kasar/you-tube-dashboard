import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("[v0] Missing Supabase environment variables")
      return NextResponse.json(
        {
          error: "Supabase not configured",
          message:
            "Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables",
        },
        { status: 500 },
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("channels")
      .select(
        `
        id,
        youtube_channel_id,
        channel_name,
        tribe,
        region,
        thumbnail_url,
        created_at,
        updated_at
      `,
      )
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Supabase error:", error.message)
      if (error.message.includes("Could not find the table")) {
        return NextResponse.json(
          {
            error: "Database not initialized",
            message:
              "The channels table does not exist. Please run the SQL migration script from scripts/01-create-channels-table.sql",
          },
          { status: 500 },
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const channelsWithStats = await Promise.all(
      (data || []).map(async (channel) => {
        const { data: latestStats } = await supabase
          .from("channel_stats_logs")
          .select("subscribers, views")
          .eq("channel_id", channel.id)
          .order("recorded_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        return {
          ...channel,
          subscribers: latestStats?.subscribers || 0,
          views: latestStats?.views || 0,
        }
      }),
    )

    return NextResponse.json(channelsWithStats || [])
  } catch (error) {
    console.error("[v0] Error fetching channels:", error)
    return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    const { data, error } = await supabase.from("channels").insert([body]).select()

    if (error) {
      console.error("[v0] Supabase error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data?.[0], { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating channel:", error)
    return NextResponse.json({ error: "Failed to create channel" }, { status: 500 })
  }
}
