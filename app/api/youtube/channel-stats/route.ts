import { type NextRequest, NextResponse } from "next/server"

interface YouTubeChannelResponse {
  items: Array<{
    statistics: {
      subscriberCount: string
      viewCount: string
      videoCount: string
    }
  }>
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get("channelId")

    if (!channelId) {
      return NextResponse.json({ error: "Channel ID is required" }, { status: 400 })
    }

    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "YouTube API key not configured" }, { status: 500 })
    }

    // Fetch channel statistics from YouTube API
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`,
    )

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`)
    }

    const data: YouTubeChannelResponse = await response.json()

    if (!data.items || data.items.length === 0) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    const stats = data.items[0].statistics

    return NextResponse.json({
      subscribers: Number.parseInt(stats.subscriberCount || "0"),
      views: Number.parseInt(stats.viewCount || "0"),
      videoCount: Number.parseInt(stats.videoCount || "0"),
    })
  } catch (error) {
    console.error("Error fetching YouTube stats:", error)
    return NextResponse.json({ error: "Failed to fetch channel statistics" }, { status: 500 })
  }
}
