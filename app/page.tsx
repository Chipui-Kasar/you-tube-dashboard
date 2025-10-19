"use client"

import { useState, useEffect } from "react"
import ChannelCard from "@/components/channel-card"
import SummaryBar from "@/components/summary-bar"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const TRIBES_AND_REGIONS = [
  { id: "tangkhul", name: "Tangkhul", region: "Manipur" },
  { id: "naga", name: "Naga", region: "Nagaland" },
  { id: "khasi", name: "Khasi", region: "Meghalaya" },
  { id: "garo", name: "Garo", region: "Meghalaya" },
  { id: "meitei", name: "Meitei", region: "Manipur" },
  { id: "assamese", name: "Assamese", region: "Assam" },
  { id: "manipuri", name: "Manipuri", region: "Manipur" },
  { id: "tripuri", name: "Tripuri", region: "Tripura" },
]

interface Channel {
  id: number
  youtube_channel_id: string
  channel_name: string
  tribe: string
  region: string
  thumbnail_url: string
  subscribers: number
  views: number
}

interface ApiError {
  error: string
  message?: string
}

export default function YouTubeDashboard() {
  const [selectedTribe, setSelectedTribe] = useState(TRIBES_AND_REGIONS[0].id)
  const [sortBy, setSortBy] = useState<"subscribers" | "views">("subscribers")
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch("/api/channels")

        if (!response.ok) {
          const errorData = await response.json()
          setError(errorData)
          console.error("[v0] API error:", errorData)
          return
        }

        const data = await response.json()
        console.log("[v0] Fetched channels:", data)
        setChannels(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("[v0] Error fetching channels:", error)
        setError({
          error: "Connection error",
          message: "Failed to connect to the server",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchChannels()
  }, [])

  const tribeChannels = channels.filter((ch) => ch.tribe.toLowerCase() === selectedTribe.toLowerCase())

  const sortedChannels = [...tribeChannels].sort((a, b) => {
    if (sortBy === "subscribers") {
      return b.subscribers - a.subscribers
    }
    return b.views - a.views
  })

  const totalSubscribers = sortedChannels.reduce((sum, ch) => sum + ch.subscribers, 0)
  const totalViews = sortedChannels.reduce((sum, ch) => sum + ch.views, 0)

  const currentTribe = TRIBES_AND_REGIONS.find((t) => t.id === selectedTribe)

  const handleSyncStats = async () => {
    try {
      const response = await fetch("/api/channels/sync-stats", {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to sync stats")

      const result = await response.json()
      toast.success(`Updated ${result.updated} channels`)

      const channelsResponse = await fetch("/api/channels")
      const updatedChannels = await channelsResponse.json()
      setChannels(Array.isArray(updatedChannels) ? updatedChannels : [])
    } catch (error) {
      console.error("[v0] Error syncing stats:", error)
      toast.error("Failed to sync statistics")
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">YouTube Tribal Top Channels</h1>
              <p className="mt-2 text-muted-foreground">
                Explore the top-performing YouTube channels by tribe and region
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSyncStats} variant="outline">
                Sync Stats
              </Button>
              <Button asChild>
                <a href="/admin">Admin</a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4">
            <h3 className="font-semibold text-red-900">{error.error}</h3>
            <p className="mt-2 text-sm text-red-800">{error.message}</p>
            <div className="mt-4 space-y-2 text-sm text-red-800">
              <p className="font-semibold">Setup Instructions:</p>
              <ol className="list-inside list-decimal space-y-1">
                <li>Go to the "Vars" section in the v0 sidebar</li>
                <li>Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from your Supabase project</li>
                <li>Run the SQL migration: scripts/01-create-channels-table.sql</li>
                <li>Refresh this page</li>
              </ol>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Select Tribe & Region</label>
            <select
              value={selectedTribe}
              onChange={(e) => setSelectedTribe(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground sm:w-64"
            >
              {TRIBES_AND_REGIONS.map((tribe) => (
                <option key={tribe.id} value={tribe.id}>
                  {tribe.name} - {tribe.region}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Sort By</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy("subscribers")}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  sortBy === "subscribers"
                    ? "bg-primary text-primary-foreground"
                    : "border border-input bg-background text-foreground hover:bg-muted"
                }`}
              >
                Subscribers
              </button>
              <button
                onClick={() => setSortBy("views")}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  sortBy === "views"
                    ? "bg-primary text-primary-foreground"
                    : "border border-input bg-background text-foreground hover:bg-muted"
                }`}
              >
                Views
              </button>
            </div>
          </div>
        </div>

        {/* Summary Bar */}
        <SummaryBar totalSubscribers={totalSubscribers} totalViews={totalViews} />

        {/* Tribe Info */}
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            Showing top channels for <span className="font-semibold text-foreground">{currentTribe?.name}</span> tribe
            in <span className="font-semibold text-foreground">{currentTribe?.region}</span>
          </p>
        </div>

        {/* Channels Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <p className="text-muted-foreground">Loading channels...</p>
          </div>
        ) : sortedChannels.length === 0 ? (
          <div className="flex justify-center py-12">
            <p className="text-muted-foreground">No channels found for this tribe. Add some in the admin dashboard.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sortedChannels.map((channel, index) => (
              <ChannelCard
                key={channel.id}
                channel={{
                  ...channel,
                  rank: index + 1,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
