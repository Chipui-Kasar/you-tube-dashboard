import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  try {
    // 1️⃣ Get all channels
    const { data: channels, error } = await supabase
      .from("channels")
      .select("channel_id, channel_name");
    if (error) throw error;

    // 2️⃣ For each channel, fetch stats from YouTube
    for (const ch of channels) {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${ch.channel_id}&key=${process.env.YOUTUBE_API_KEY}`
      );
      const json = await res.json();
      const stats = json.items?.[0]?.statistics;

      if (stats) {
        // 3️⃣ Insert into channel_stats
        await supabase.from("channel_stats").insert([
          {
            channel_id: ch.channel_id,
            subscribers: stats.subscriberCount,
            views: stats.viewCount,
          },
        ]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
