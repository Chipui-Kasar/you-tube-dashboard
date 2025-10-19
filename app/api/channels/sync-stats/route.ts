import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    // Fetch all channels from database
    const { data: channels, error: fetchError } = await supabase.from("channels").select("*")

    if (fetchError) throw fetchError

    // Update stats for each channel
    const updates = await Promise.all(
      (channels || []).map(async (channel) => {
        try {
          const statsResponse = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/youtube/channel-stats?channelId=${channel.youtube_channel_id}`,
          )

          if (!statsResponse.ok) {
            console.error(`Failed to fetch stats for ${channel.youtube_channel_id}`)
            return null
          }

          const stats = await statsResponse.json()

          // Update channel in database
          const { error: updateError } = await supabase
            .from("channels")
            .update({
              subscribers: stats.subscribers,
              views: stats.views,
              updated_at: new Date().toISOString(),
            })
            .eq("id", channel.id)

          if (updateError) throw updateError

          return { id: channel.id, success: true }
        } catch (error) {
          console.error(`Error updating channel ${channel.id}:`, error)
          return { id: channel.id, success: false }
        }
      }),
    )

    const successful = updates.filter((u) => u?.success).length

    return NextResponse.json({
      message: `Updated ${successful} out of ${channels?.length} channels`,
      updated: successful,
      total: channels?.length,
    })
  } catch (error) {
    console.error("Error syncing stats:", error)
    return NextResponse.json({ error: "Failed to sync channel statistics" }, { status: 500 })
  }
}
