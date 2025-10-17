import { Card } from "@/components/ui/card"

interface Channel {
  id: number
  channel_name: string
  subscribers: number
  views: number
  thumbnail_url: string
  rank: number
}

export default function ChannelCard({ channel }: { channel: Channel }) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K"
    }
    return num.toString()
  }

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary">
      <div className="relative p-4">
        {/* Rank Badge */}
        <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          #{channel.rank}
        </div>

        {/* Thumbnail */}
        <div className="mb-4 overflow-hidden rounded-lg bg-muted">
          <img
            src={channel.thumbnail_url || "/placeholder.svg"}
            alt={channel.channel_name}
            className="h-24 w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Channel Info */}
        <h3 className="mb-3 line-clamp-2 font-semibold text-foreground group-hover:text-primary">
          {channel.channel_name}
        </h3>

        {/* Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Subscribers</span>
            <span className="font-semibold text-foreground">{formatNumber(channel.subscribers)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total Views</span>
            <span className="font-semibold text-foreground">{formatNumber(channel.views)}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
