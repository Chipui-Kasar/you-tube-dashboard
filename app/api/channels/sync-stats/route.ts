import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

interface YouTubeChannelItem {
  id: string
  statistics: {
    subscriberCount: string
    viewCount: string
    videoCount: string
  }
}

interface YouTubeAPIResponse {
  items: YouTubeChannelItem[]
}

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

    if (!channels || channels.length === 0) {
      return NextResponse.json({
        message: "No channels found",
        updated: 0,
        skipped: 0,
        failed: 0,
        total: 0,
      })
    }

    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      console.error(`[v0] YouTube API key not configured`)
      return NextResponse.json({ error: "YouTube API key not configured" }, { status: 500 })
    }

    // Check for existing logs today to filter out channels that don't need updates
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

    const { data: existingLogs } = await supabase
      .from("channel_stats_logs")
      .select("channel_id")
      .gte("recorded_at", startOfDay)
      .lt("recorded_at", endOfDay)

    const loggedChannelIds = new Set(existingLogs?.map(log => log.channel_id) || [])
    const channelsToUpdate = channels.filter(channel => !loggedChannelIds.has(channel.id))
    const skippedCount = channels.length - channelsToUpdate.length

    console.log(`[v0] Found ${channelsToUpdate.length} channels to update, ${skippedCount} already logged today`)

    if (channelsToUpdate.length === 0) {
      return NextResponse.json({
        message: `All ${channels.length} channels already logged today`,
        updated: 0,
        skipped: skippedCount,
        failed: 0,
        total: channels.length,
      })
    }

    // Batch channels into groups of 50 (YouTube API limit)
    const BATCH_SIZE = 50
    const batches = []
    for (let i = 0; i < channelsToUpdate.length; i += BATCH_SIZE) {
      batches.push(channelsToUpdate.slice(i, i + BATCH_SIZE))
    }

    console.log(`[v0] Processing ${batches.length} batches of channels`)

    let totalUpdated = 0
    let totalFailed = 0

    // Process each batch
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]
      const channelIds = batch.map(channel => channel.youtube_channel_id).join(',')
      
      console.log(`[v0] Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} channels`)

      try {
        // Single API call for the entire batch
        const statsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelIds}&key=${apiKey}`,
        )

        if (!statsResponse.ok) {
          console.error(`[v0] Failed to fetch batch ${batchIndex + 1}: ${statsResponse.status}`)
          totalFailed += batch.length
          continue
        }

        const data: YouTubeAPIResponse = await statsResponse.json()
        
        if (!data.items) {
          console.error(`[v0] No items in batch ${batchIndex + 1} response`)
          totalFailed += batch.length
          continue
        }

        // Create a map of channel_id -> stats for quick lookup
        const statsMap = new Map()
        data.items.forEach((item: YouTubeChannelItem) => {
          if (item.statistics) {
            statsMap.set(item.id, {
              subscribers: Number.parseInt(item.statistics.subscriberCount || "0"),
              views: Number.parseInt(item.statistics.viewCount || "0"),
              videoCount: Number.parseInt(item.statistics.videoCount || "0"),
            })
          }
        })

        // Insert stats for all channels in this batch
        const insertPromises = batch.map(async (channel) => {
          try {
            const stats = statsMap.get(channel.youtube_channel_id)
            
            if (!stats) {
              console.error(`[v0] No stats found for channel: ${channel.youtube_channel_id}`)
              return { success: false }
            }

            const { error: insertError } = await supabase.from("channel_stats_logs").insert({
              channel_id: channel.id,
              youtube_channel_id: channel.youtube_channel_id,
              subscribers: stats.subscribers,
              views: stats.views,
              recorded_at: new Date().toISOString(),
            })

            if (insertError) {
              console.error(`[v0] Error inserting stats for channel ${channel.id}:`, insertError)
              return { success: false }
            }

            console.log(`[v0] Successfully logged stats for ${channel.channel_name}: ${stats.subscribers} subscribers, ${stats.views} views`)
            return { success: true }
          } catch (error) {
            console.error(`[v0] Error processing channel ${channel.id}:`, error)
            return { success: false }
          }
        })

        const results = await Promise.all(insertPromises)
        const batchUpdated = results.filter(r => r.success).length
        const batchFailed = results.filter(r => !r.success).length
        
        totalUpdated += batchUpdated
        totalFailed += batchFailed

        console.log(`[v0] Batch ${batchIndex + 1} completed: ${batchUpdated} updated, ${batchFailed} failed`)

      } catch (error) {
        console.error(`[v0] Error processing batch ${batchIndex + 1}:`, error)
        totalFailed += batch.length
      }
    }

    return NextResponse.json({
      message: `Logged stats for ${totalUpdated} channels, skipped ${skippedCount} (already logged today), failed ${totalFailed}`,
      updated: totalUpdated,
      skipped: skippedCount,
      failed: totalFailed,
      total: channels.length,
    })
  } catch (error) {
    console.error("[v0] Error syncing stats:", error)
    return NextResponse.json({ error: "Failed to sync channel statistics", details: String(error) }, { status: 500 })
  }
}
