"use client";

import { useState, useEffect } from "react";
import ChannelCard from "@/components/channel-card";
import SummaryBar from "@/components/summary-bar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const TRIBES_AND_REGIONS = [
  { id: "tangkhul", name: "Tangkhul", region: "Manipur" },
  { id: "naga", name: "Naga", region: "Nagaland" },
  { id: "khasi", name: "Khasi", region: "Meghalaya" },
  { id: "garo", name: "Garo", region: "Meghalaya" },
  { id: "meitei", name: "Meitei", region: "Manipur" },
  { id: "assamese", name: "Assamese", region: "Assam" },
  { id: "manipuri", name: "Manipuri", region: "Manipur" },
  { id: "tripuri", name: "Tripuri", region: "Tripura" },
];

interface Channel {
  id: number;
  youtube_channel_id: string;
  channel_name: string;
  tribe: string;
  region: string;
  thumbnail_url: string;
  subscribers: number;
  views: number;
}

interface ApiError {
  error: string;
  message?: string;
}

export default function YouTubeDashboard() {
  const [selectedTribe, setSelectedTribe] = useState(TRIBES_AND_REGIONS[0].id);
  const [sortBy, setSortBy] = useState<"subscribers" | "views">("subscribers");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Auto-refresh interval in minutes (5 minutes = 5 * 60 * 1000 ms)
  const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    // Check if data has been loaded before in this session
    const hasLoadedBefore =
      sessionStorage.getItem("channels_loaded") === "true";
    if (hasLoadedBefore) {
      setIsInitialLoad(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchChannels = async (isAutoRefresh = false) => {
      try {
        // Only show loading spinner on initial load, not on auto-refresh
        if (isInitialLoad && !isAutoRefresh) {
          setLoading(true);
        }
        setError(null);

        console.log(
          `[v0] ${
            isAutoRefresh ? "Auto-refreshing" : "Fetching"
          } fresh channel data...`
        );

        // Fetch channels with fresh YouTube stats
        const response = await fetch("/api/channels");

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData);
          console.error("[v0] API error:", errorData);
          return;
        }

        const data = await response.json();
        setChannels(Array.isArray(data) ? data : []);
        setLastSyncTime(new Date());

        // Mark as loaded in session storage
        sessionStorage.setItem("channels_loaded", "true");
        setIsInitialLoad(false);

        console.log(
          `[v0] Successfully ${isAutoRefresh ? "auto-refreshed" : "loaded"} ${
            data?.length || 0
          } channels with fresh stats`
        );
      } catch (error) {
        console.error("[v0] Error fetching channels:", error);
        setError({
          error: "Connection error",
          message: "Failed to connect to the server",
        });
      } finally {
        setLoading(false);
      }
    };

    // Initial load
    fetchChannels(false);

    // Set up auto-refresh interval
    const intervalId = setInterval(() => {
      console.log("[v0] Auto-refreshing data...");
      // Only refresh if not currently loading
      if (!loading) {
        fetchChannels(true); // Pass true for auto-refresh
      }
    }, AUTO_REFRESH_INTERVAL);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [AUTO_REFRESH_INTERVAL, isInitialLoad]);

  const tribeChannels = channels.filter(
    (ch) => ch.tribe.toLowerCase() === selectedTribe.toLowerCase()
  );

  const sortedChannels = [...tribeChannels].sort((a, b) => {
    if (sortBy === "subscribers") {
      return b.subscribers - a.subscribers;
    }
    return b.views - a.views;
  });

  const totalSubscribers = sortedChannels.reduce(
    (sum, ch) => sum + ch.subscribers,
    0
  );
  const totalViews = sortedChannels.reduce((sum, ch) => sum + ch.views, 0);

  const currentTribe = TRIBES_AND_REGIONS.find((t) => t.id === selectedTribe);

  const handleSyncStats = async () => {
    try {
      setLoading(true);
      console.log("[v0] Manual refresh triggered...");

      const response = await fetch("/api/channels");

      if (!response.ok) throw new Error("Failed to fetch fresh stats");

      const result = await response.json();
      setChannels(Array.isArray(result) ? result : []);
      setLastSyncTime(new Date());

      toast.success(
        `Refreshed ${result?.length || 0} channels with fresh YouTube data`
      );
    } catch (error) {
      console.error("[v0] Error refreshing stats:", error);
      toast.error("Failed to refresh statistics");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                YouTube Tribal Top Channels
              </h1>
              <p className="mt-2 text-muted-foreground">
                Explore the top-performing YouTube channels by tribe and region
              </p>
              {lastSyncTime && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Last refreshed: {lastSyncTime.toLocaleTimeString()} • Fresh
                  data every 5 minutes
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSyncStats}
                variant="outline"
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh Now"}
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
                <li>
                  Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
                  from your Supabase project
                </li>
                <li>Add YOUTUBE_API_KEY from your Google Cloud Console</li>
                <li>
                  Run the SQL migration: scripts/01-create-channels-table.sql
                </li>
                <li>Refresh this page</li>
              </ol>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Select Tribe & Region
            </label>
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
            <label className="text-sm font-medium text-foreground">
              Sort By
            </label>
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
        <SummaryBar
          totalSubscribers={totalSubscribers}
          totalViews={totalViews}
        />

        {/* Tribe Info */}
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            Showing top channels for{" "}
            <span className="font-semibold text-foreground">
              {currentTribe?.name}
            </span>{" "}
            tribe in{" "}
            <span className="font-semibold text-foreground">
              {currentTribe?.region}
            </span>
          </p>
        </div>

        {/* Channels Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <p className="text-muted-foreground">Loading channels...</p>
          </div>
        ) : sortedChannels.length === 0 ? (
          <div className="flex justify-center py-12">
            <p className="text-muted-foreground">
              No channels found for this tribe. Add some in the admin dashboard.
            </p>
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
  );
}
