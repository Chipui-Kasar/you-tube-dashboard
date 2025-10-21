import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

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

// In-memory cache to prevent too frequent API calls (cache for 1 minute)
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 60 * 1000 // 1 minute

async function fetchFreshYouTubeStats(channels: any[]) {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    console.error("[v0] YouTube API key not configured")
    return channels.map(channel => ({ ...channel, subscribers: 0, views: 0 }))
  }

  try {
    // Batch channels into groups of 50 (YouTube API limit)
    const BATCH_SIZE = 50
    const batches = []
    for (let i = 0; i < channels.length; i += BATCH_SIZE) {
      batches.push(channels.slice(i, i + BATCH_SIZE))
    }

    const allStats = new Map()

    // Process each batch
    for (const batch of batches) {
      const channelIds = batch.map(channel => channel.youtube_channel_id).join(',')
      
      // Check cache first
      const cacheKey = `batch_${channelIds}`
      const cached = cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        cached.data.forEach((stats: any, channelId: string) => {
          allStats.set(channelId, stats)
        })
        continue
      }

      // Fetch fresh data from YouTube API
      const statsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelIds}&key=${apiKey}`,
      )

      if (!statsResponse.ok) {
        console.error(`[v0] Failed to fetch YouTube stats: ${statsResponse.status}`)
        continue
      }

      const data: YouTubeAPIResponse = await statsResponse.json()
      
      if (data.items) {
        const batchStats = new Map()
        data.items.forEach((item: YouTubeChannelItem) => {
          if (item.statistics) {
            const stats = {
              subscribers: Number.parseInt(item.statistics.subscriberCount || "0"),
              views: Number.parseInt(item.statistics.viewCount || "0"),
              videoCount: Number.parseInt(item.statistics.videoCount || "0"),
            }
            allStats.set(item.id, stats)
            batchStats.set(item.id, stats)
          }
        })
        
        // Cache the batch results
        cache.set(cacheKey, { data: batchStats, timestamp: Date.now() })
      }
    }

    // Map stats back to channels
    return channels.map(channel => ({
      ...channel,
      subscribers: allStats.get(channel.youtube_channel_id)?.subscribers || 0,
      views: allStats.get(channel.youtube_channel_id)?.views || 0,
    }))

  } catch (error) {
    console.error("[v0] Error fetching YouTube stats:", error)
    return channels.map(channel => ({ ...channel, subscribers: 0, views: 0 }))
  }
}

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

    const channelsWithStats = await fetchFreshYouTubeStats(data || [])

    return NextResponse.json(channelsWithStats)
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
