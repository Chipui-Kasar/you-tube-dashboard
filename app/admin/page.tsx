"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import AdminChannelForm from "@/components/admin-channel-form"
import AdminChannelTable from "@/components/admin-channel-table"

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
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // Fetch channels from Supabase
  const fetchChannels = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("channels").select("*").order("created_at", { ascending: false })

      if (error) throw error
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

  // Filter channels based on search
  const filteredChannels = channels.filter(
    (channel) =>
      channel.channel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      channel.youtube_channel_id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Manage YouTube channels by tribe and region</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Add Channel Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Channel</CardTitle>
            <CardDescription>
              Add a YouTube channel to the database. Stats will be fetched automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showForm ? (
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
            ) : (
              <Button onClick={() => setShowForm(true)}>+ Add Channel</Button>
            )}
          </CardContent>
        </Card>

        {/* Search and Filter */}
        <div className="mb-6">
          <Input
            placeholder="Search by channel name or YouTube ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Channels Table */}
        <Card>
          <CardHeader>
            <CardTitle>Channels ({filteredChannels.length})</CardTitle>
            <CardDescription>All YouTube channels organized by tribe and region</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <p className="text-muted-foreground">Loading channels...</p>
              </div>
            ) : filteredChannels.length === 0 ? (
              <div className="flex justify-center py-8">
                <p className="text-muted-foreground">No channels found</p>
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
