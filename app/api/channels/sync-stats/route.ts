import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[v0] Missing Supabase admin credentials")
      return NextResponse.json(
        { error: "Admin credentials not configured", details: "SUPABASE_SERVICE_ROLE_KEY is missing" },
        { status: 500 },
      )
    }

    const supabase = createServerClient(supabaseUrl, serviceRoleKey, {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    })

    // Fetch all channels from database
    const { data: channels, error: fetchError } = await supabase.from("channels").select("*")

    if (fetchError) throw fetchError

    const updates = await Promise.all(
      (channels || []).map(async (channel) => {
        try {
          console.log(`[v0] Fetching stats for channel: ${channel.youtube_channel_id}`)

          const statsResponse = await fetch(`/api/youtube/channel-stats?channelId=${channel.youtube_channel_id}`, {
            headers: { "Content-Type": "application/json" },
          })

          if (!statsResponse.ok) {
            const errorText = await statsResponse.text()
            console.error(
              `[v0] Failed to fetch stats for ${channel.youtube_channel_id}: ${statsResponse.status} ${errorText}`,
            )
            return null
          }

          const stats = await statsResponse.json()
          console.log(`[v0] Got stats for ${channel.youtube_channel_id}:`, stats)

          const { error: insertError } = await supabase.from("channel_stats_logs").insert({
            channel_id: channel.id,
            youtube_channel_id: channel.youtube_channel_id,
            subscribers: stats.subscribers,
            views: stats.views,
            recorded_at: new Date().toISOString(),
          })

          if (insertError) throw insertError

          return { id: channel.id, success: true }
        } catch (error) {
          console.error(`[v0] Error logging stats for channel ${channel.id}:`, error)
          return { id: channel.id, success: false }
        }
      }),
    )

    const successful = updates.filter((u) => u?.success).length

    return NextResponse.json({
      message: `Logged stats for ${successful} out of ${channels?.length} channels`,
      updated: successful,
      total: channels?.length,
    })
  } catch (error) {
    console.error("[v0] Error syncing stats:", error)
    return NextResponse.json({ error: "Failed to sync channel statistics", details: String(error) }, { status: 500 })
  }
}
