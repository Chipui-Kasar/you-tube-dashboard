"use client";

import { useState, useEffect, type CSSProperties } from "react";
import ChannelCard, { ChannelCardSkeleton } from "@/components/channel-card";
import SummaryBar from "@/components/summary-bar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertCircle,
  Clock,
  Eye,
  Inbox,
  LayoutGrid,
  RefreshCw,
  Settings,
  TrendingUp,
  Youtube,
} from "lucide-react";

const COLUMN_OPTIONS = [1, 2, 3, 4, 5] as const;
const COLUMNS_STORAGE_KEY = "channels_per_row";

const TRIBES_AND_REGIONS = [
  { id: "tangkhul", name: "Tangkhul", region: "Manipur" },
  { id: "naga", name: "Naga", region: "Nagaland" },
  { id: "khasi", name: "Khasi", region: "Meghalaya" },
  { id: "garo", name: "Garo", region: "Meghalaya" },
  { id: "meitei", name: "Meitei", region: "Manipur" },
  { id: "assamese", name: "Assamese", region: "Assam" },
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
  const [columnsPerRow, setColumnsPerRow] = useState(3);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
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
    const stored = Number(localStorage.getItem(COLUMNS_STORAGE_KEY));
    if (COLUMN_OPTIONS.includes(stored as (typeof COLUMN_OPTIONS)[number])) {
      setColumnsPerRow(stored);
    }
  }, []);

  const handleColumnsChange = (value: number) => {
    setColumnsPerRow(value);
    localStorage.setItem(COLUMNS_STORAGE_KEY, String(value));
  };

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
      <div className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white">
                <Youtube className="size-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                  YouTube Tribal Top Channels
                </h1>
                <p className="text-sm text-muted-foreground">
                  Explore the top-performing YouTube channels by tribe and
                  region
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:flex-col sm:items-end">
              <div className="flex gap-2">
                <Button
                  onClick={handleSyncStats}
                  variant="outline"
                  disabled={loading}
                >
                  <RefreshCw
                    className={`size-4 ${loading ? "animate-spin" : ""}`}
                  />
                  {loading ? "Refreshing..." : "Refresh"}
                </Button>
                <Button asChild>
                  <a href="/admin">
                    <Settings className="size-4" />
                    Admin
                  </a>
                </Button>
              </div>
              {lastSyncTime && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  Last refreshed {lastSyncTime.toLocaleTimeString()} · auto
                  every 5 min
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-8 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-200">
                {error.error}
              </h3>
              <p className="mt-1 text-sm text-red-800 dark:text-red-300">
                {error.message}
              </p>
              <div className="mt-4 space-y-2 text-sm text-red-800 dark:text-red-300">
                <p className="font-semibold">Setup Instructions:</p>
                <ol className="list-inside list-decimal space-y-1">
                  <li>Go to the "Vars" section in the v0 sidebar</li>
                  <li>
                    Add NEXT_PUBLIC_SUPABASE_URL and
                    NEXT_PUBLIC_SUPABASE_ANON_KEY from your Supabase project
                  </li>
                  <li>Add YOUTUBE_API_KEY from your Google Cloud Console</li>
                  <li>
                    Run the SQL migration: scripts/01-create-channels-table.sql
                  </li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Select Tribe & Region
            </label>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)] sm:[mask-image:none]">
              {TRIBES_AND_REGIONS.map((tribe) => (
                <button
                  key={tribe.id}
                  onClick={() => setSelectedTribe(tribe.id)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    selectedTribe === tribe.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border border-input bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {tribe.name}{" "}
                  <span
                    className={
                      selectedTribe === tribe.id
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }
                  >
                    · {tribe.region}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              Sort by
            </span>
            <div className="inline-flex gap-1 rounded-lg bg-muted p-1">
              <button
                onClick={() => setSortBy("subscribers")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  sortBy === "subscribers"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <TrendingUp className="size-3.5" />
                Subscribers
              </button>
              <button
                onClick={() => setSortBy("views")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  sortBy === "views"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Eye className="size-3.5" />
                Views
              </button>
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <LayoutGrid className="size-3.5" />
              Per row
            </span>
            <div className="inline-flex gap-1 rounded-lg bg-muted p-1">
              {COLUMN_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => handleColumnsChange(n)}
                  className={`min-w-8 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    columnsPerRow === n
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Bar */}
        <SummaryBar
          totalSubscribers={totalSubscribers}
          totalViews={totalViews}
          channelCount={sortedChannels.length}
        />
       


        {/* Tribe Info */}
        <div className="mb-6 mt-6 rounded-lg border border-border bg-card p-4">
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
          <div
            className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(max(240px,calc(100%_/_var(--cols))),1fr))]"
            style={{ "--cols": columnsPerRow } as CSSProperties}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <ChannelCardSkeleton key={i} />
            ))}
          </div>
        ) : sortedChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
            <Inbox className="size-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              No channels found for this tribe. Add some in the admin
              dashboard.
            </p>
            <Button asChild variant="outline" size="sm">
              <a href="/admin">Go to Admin</a>
            </Button>
          </div>
        ) : (
          <div
            className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(max(240px,calc(100%_/_var(--cols))),1fr))]"
            style={{ "--cols": columnsPerRow } as CSSProperties}
          >
            {sortedChannels.map((channel, index) => (
              <ChannelCard
                key={channel.id}
                channel={{
                  ...channel,
                  rank: index + 1,
                }}
                metric={sortBy}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
