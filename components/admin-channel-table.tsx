"use client"

import { Button } from "@/components/ui/button"
import { Trash2, Edit2 } from "lucide-react"

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

interface AdminChannelTableProps {
  channels: Channel[]
  onEdit: (channel: Channel) => void
  onDelete: (id: number) => void
}

export default function AdminChannelTable({ channels, onEdit, onDelete }: AdminChannelTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 font-medium text-foreground">Channel Name</th>
            <th className="text-left py-3 px-4 font-medium text-foreground">Tribe</th>
            <th className="text-left py-3 px-4 font-medium text-foreground">Region</th>
            <th className="text-right py-3 px-4 font-medium text-foreground">Subscribers</th>
            <th className="text-right py-3 px-4 font-medium text-foreground">Views</th>
            <th className="text-center py-3 px-4 font-medium text-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {channels.map((channel) => (
            <tr key={channel.id} className="border-b border-border hover:bg-muted/50">
              <td className="py-3 px-4 text-foreground">{channel.channel_name}</td>
              <td className="py-3 px-4 text-muted-foreground">{channel.tribe}</td>
              <td className="py-3 px-4 text-muted-foreground">{channel.region}</td>
              <td className="py-3 px-4 text-right text-foreground">{(channel.subscribers / 1000000).toFixed(1)}M</td>
              <td className="py-3 px-4 text-right text-foreground">{(channel.views / 1000000).toFixed(1)}M</td>
              <td className="py-3 px-4 text-center">
                <div className="flex gap-2 justify-center">
                  <Button size="sm" variant="ghost" onClick={() => onEdit(channel)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(channel.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
