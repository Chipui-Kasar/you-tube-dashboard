"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"

interface AdminChannelFormProps {
  tribes: string[]
  regions: string[]
  onSave: (data: {
    youtube_channel_id: string
    channel_name: string
    tribe: string
    region: string
    thumbnail_url: string
  }) => Promise<void>
  onCancel: () => void
  initialData?: {
    id: number
    youtube_channel_id: string
    channel_name: string
    tribe: string
    region: string
    thumbnail_url: string
  }
}

export default function AdminChannelForm({ tribes, regions, onSave, onCancel, initialData }: AdminChannelFormProps) {
  const [formData, setFormData] = useState({
    youtube_channel_id: initialData?.youtube_channel_id || "",
    channel_name: initialData?.channel_name || "",
    tribe: initialData?.tribe || tribes[0],
    region: initialData?.region || regions[0],
    thumbnail_url: initialData?.thumbnail_url || "",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.youtube_channel_id || !formData.channel_name) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      setLoading(true)
      await onSave(formData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-0 bg-muted/50">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">YouTube Channel ID *</label>
              <Input
                type="text"
                placeholder="e.g., UCxxxxxxxxxxxxxx"
                value={formData.youtube_channel_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    youtube_channel_id: e.target.value,
                  })
                }
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Channel Name *</label>
              <Input
                type="text"
                placeholder="e.g., Tangkhul Vloggers"
                value={formData.channel_name}
                onChange={(e) => setFormData({ ...formData, channel_name: e.target.value })}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Tribe</label>
              <select
                value={formData.tribe}
                onChange={(e) => setFormData({ ...formData, tribe: e.target.value })}
                disabled={loading}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
              >
                {tribes.map((tribe) => (
                  <option key={tribe} value={tribe}>
                    {tribe}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Region</label>
              <select
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                disabled={loading}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
              >
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">Thumbnail URL</label>
              <Input
                type="url"
                placeholder="https://..."
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : initialData ? "Update Channel" : "Add Channel"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
