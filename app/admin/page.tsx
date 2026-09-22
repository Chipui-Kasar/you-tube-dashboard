"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import AdminChannelForm from "@/components/admin-channel-form"
import AdminChannelTable from "@/components/admin-channel-table"
import { createClient } from "@/lib/supabase/client"
import { formatCompactNumber } from "@/lib/utils"
import { Eye, Inbox, LogOut, MapPin, Plus, Search, Tv, Users, Youtube } from "lucide-react"

const TRIBES = ["Tangkhul", "Naga", "Khasi", "Garo", "Meitei", "Assamese", "Manipuri", "Tripuri"]
const REGIONS = ["Manipur", "Nagaland", "Meghalaya", "Assam", "Tripura"]

interface Channel {
  id: number
  youtube_channel_id: string
  channel_name: string
  tribe: string
  region: string
  thumbnail_url: string
  subscribers: number
  views: number
  created_at: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [tribeFilter, setTribeFilter] = useState<string>("all")
  const [regionFilter, setRegionFilter] = useState<string>("all")
  const [user, setUser] = useState<any>(null)

  // Route access is already enforced server-side by middleware.ts before this
  // page's JS ever loads, so this is display-only (e.g. "Logged in as: ...")
  // and must never block or gate rendering the dashboard.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth
      .getUser()
      .then(({ data: { user: sessionUser } }) => setUser(sessionUser))
      .catch((error) => console.error("[v0] Failed to load current user:", error))
  }, [])

  // Fetch channels from Supabase
  const fetchChannels = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/channels")

      if (!response.ok) throw new Error("Failed to fetch channels")

      const data = await response.json()
      setChannels(data || [])
    } catch (error) {
      console.error("Error fetching channels:", error)
      toast.error("Failed to fetch channels")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChannels()
  }, [])

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()

      if (error) throw error

      toast.success("Logged out successfully")
      router.push("/admin/login")
    } catch (error) {
      console.error("[v0] Logout error:", error)
      toast.error("Failed to logout")
    }
  }

  // Handle add/edit channel
  const handleSaveChannel = async (formData: {
    youtube_channel_id: string
    channel_name: string
    tribe: string
    region: string
    thumbnail_url: string
  }) => {
    try {
      if (editingChannel) {
        // Update existing channel via API
        const response = await fetch(`/api/admin/channels/${editingChannel.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to update channel")
        }

        toast.success("Channel updated successfully")
      } else {
        // Add new channel via API
        const response = await fetch("/api/admin/channels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to create channel")
        }

        toast.success("Channel added successfully")
      }

      setShowForm(false)
      setEditingChannel(null)
      fetchChannels()
    } catch (error) {
      console.error("Error saving channel:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save channel")
    }
  }

  // Handle delete channel
  const handleDeleteChannel = async (id: number) => {
    if (!confirm("Are you sure you want to delete this channel?")) return

    try {
      const response = await fetch(`/api/admin/channels/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete channel")
      }

      toast.success("Channel deleted successfully")
      fetchChannels()
    } catch (error) {
      console.error("Error deleting channel:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete channel")
    }
  }

  // Filter channels based on search, tribe, and region (all compose together;
  // sorting is then applied on top of this filtered set inside the table).
  const filteredChannels = channels.filter((channel) => {
    const matchesSearch =
      channel.channel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      channel.youtube_channel_id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTribe = tribeFilter === "all" || channel.tribe === tribeFilter
    const matchesRegion = regionFilter === "all" || channel.region === regionFilter
    return matchesSearch && matchesTribe && matchesRegion
  })

  const totalSubscribers = channels.reduce((sum, ch) => sum + ch.subscribers, 0)
  const totalViews = channels.reduce((sum, ch) => sum + ch.views, 0)
  const regionsCovered = new Set(channels.map((ch) => ch.region)).size

  const stats = [
    {
      label: "Total Channels",
      value: channels.length.toString(),
      icon: Tv,
      gradient: "from-primary/10 to-primary/5",
      iconColor: "text-primary",
    },
    {
      label: "Total Subscribers",
      value: formatCompactNumber(totalSubscribers),
      icon: Users,
      gradient: "from-accent/10 to-accent/5",
      iconColor: "text-accent",
    },
    {
      label: "Total Views",
      value: formatCompactNumber(totalViews),
      icon: Eye,
      gradient: "from-emerald-500/10 to-emerald-500/5",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Regions Covered",
      value: regionsCovered.toString(),
      icon: MapPin,
      gradient: "from-amber-500/10 to-amber-500/5",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
  ]

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white">
                <Youtube className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold leading-tight text-foreground">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Manage YouTube channels by tribe and region</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user && (
                <div className="hidden items-center gap-2 sm:flex">
                  {user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                    <img
                      src={user.user_metadata.avatar_url || user.user_metadata.picture}
                      alt=""
                      className="size-8 rounded-full border border-border"
                    />
                  ) : (
                    <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {user.email?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-muted-foreground">{user.email}</span>
                </div>
              )}
              <Button asChild variant="outline" size="sm">
                <a href="/">View Site</a>
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="size-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className={`bg-gradient-to-br ${stat.gradient} p-5`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <stat.icon className={`size-7 opacity-70 ${stat.iconColor}`} />
              </div>
            </Card>
          ))}
        </div>

        {/* Add Channel Section */}
        <Card className="mb-8">
          <CardHeader className={showForm ? "border-b" : undefined}>
            <CardTitle>Add New Channel</CardTitle>
            <CardDescription>Add a YouTube channel to the database. Stats will be fetched automatically.</CardDescription>
            {!showForm && (
              <CardAction>
                <Button onClick={() => setShowForm(true)} size="sm">
                  <Plus className="size-4" />
                  Add Channel
                </Button>
              </CardAction>
            )}
          </CardHeader>
          {showForm && (
            <CardContent>
              <AdminChannelForm
                tribes={TRIBES}
                regions={REGIONS}
                onSave={handleSaveChannel}
                onCancel={() => {
                  setShowForm(false)
                  setEditingChannel(null)
                }}
                initialData={editingChannel || undefined}
              />
            </CardContent>
          )}
        </Card>

        {/* Channels */}
        <Card className="gap-0 py-0 overflow-hidden">
          <CardHeader className="border-b px-6 py-5">
            <CardTitle>Channels</CardTitle>
            <CardDescription>
              {filteredChannels.length} of {channels.length} channel{channels.length === 1 ? "" : "s"} shown
            </CardDescription>
          </CardHeader>

          <div className="flex flex-col gap-4 border-b bg-muted/20 px-6 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by channel name or YouTube ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-background pl-9"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tribe</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTribeFilter("all")}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    tribeFilter === "all"
                      ? "bg-primary text-primary-foreground"
                      : "border border-input bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  All Tribes
                </button>
                {TRIBES.map((tribe) => (
                  <button
                    key={tribe}
                    onClick={() => setTribeFilter(tribe)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      tribeFilter === tribe
                        ? "bg-primary text-primary-foreground"
                        : "border border-input bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    {tribe}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Region</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setRegionFilter("all")}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    regionFilter === "all"
                      ? "bg-primary text-primary-foreground"
                      : "border border-input bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  All Regions
                </button>
                {REGIONS.map((region) => (
                  <button
                    key={region}
                    onClick={() => setRegionFilter(region)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      regionFilter === region
                        ? "bg-primary text-primary-foreground"
                        : "border border-input bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>

            {(searchTerm || tribeFilter !== "all" || regionFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("")
                  setTribeFilter("all")
                  setRegionFilter("all")
                }}
                className="self-start text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>

          <CardContent className="px-6 py-6">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredChannels.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
                <Inbox className="size-10 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {channels.length === 0 ? "No channels yet. Add your first one above." : "No channels match your filters."}
                </p>
              </div>
            ) : (
              <AdminChannelTable
                channels={filteredChannels}
                onEdit={(channel) => {
                  setEditingChannel(channel)
                  setShowForm(true)
                }}
                onDelete={handleDeleteChannel}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
