import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompactNumber } from "@/lib/utils";
import { Eye, Users, Youtube } from "lucide-react";

interface Channel {
  id: number;
  youtube_channel_id: string;
  channel_name: string;
  subscribers: number;
  views: number;
  thumbnail_url: string;
  rank: number;
  source?: string;
}

const RANK_STYLES: Record<number, string> = {
  1: "bg-gradient-to-br from-yellow-400 to-amber-500 text-amber-950",
  2: "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900",
  3: "bg-gradient-to-br from-amber-600 to-amber-800 text-amber-50",
};

export default function ChannelCard({ channel }: { channel: Channel }) {
  const rankStyle =
    RANK_STYLES[channel.rank] ?? "bg-primary text-primary-foreground";
  const liveUrl = `https://www.youtube.com/channel/${channel.youtube_channel_id}/live`;

  const subscriberCounterUrl =
    channel.source === "socialcounts"
      ? `https://socialcounts.org/youtube-live-subscriber-count/${channel.youtube_channel_id}/embed`
      : `https://livecounts.io/embed/youtube-live-subscriber-counter/${channel.youtube_channel_id}`;

  const viewCounterUrl = `https://socialcounts.org/youtube-live-subscriber-count/${channel.youtube_channel_id}/embed?counter=0&fullscreen=true`;

  return (
    <Card className="group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
      <div
        className={`absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shadow-sm ${rankStyle}`}
      >
        #{channel.rank}
      </div>

      <div className="mb-4 flex items-center gap-3 pr-8">
        <img
          src={channel.thumbnail_url || "/placeholder.svg"}
          alt={channel.channel_name}
          className="h-14 w-14 shrink-0 rounded-full border border-border object-cover"
        />
        <h3 className="line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {channel.channel_name}
        </h3>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="min-w-0 rounded-lg bg-muted/60 p-2.5">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="size-3.5 shrink-0" />
            <span className="truncate text-[11px]">Subscribers</span>
          </div>
          {channel.source ? (
            <iframe
              title={`${channel.channel_name} live subscriber count`}
              src={subscriberCounterUrl}
              className="mt-1 h-10 w-full rounded border-0"
              scrolling="no"
            />
          ) : (
            <p className="mt-1 truncate text-base font-bold text-foreground">
              {formatCompactNumber(channel.subscribers)}
            </p>
          )}
        </div>
        <div className="min-w-0 rounded-lg bg-muted/60 p-2.5">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Eye className="size-3.5 shrink-0" />
            <span className="truncate text-[11px]">Views</span>
          </div>
          {channel.source ? (
            <iframe
              title={`${channel.channel_name} live view count`}
              src={viewCounterUrl}
              className="mt-1 h-10 w-full rounded border-0"
              scrolling="no"
            />
          ) : (
            <p className="mt-1 truncate text-base font-bold text-foreground">
              {formatCompactNumber(channel.views)}
            </p>
          )}
        </div>
      </div>

      <a
        href={liveUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
      >
        <Youtube className="size-4 shrink-0" />
        Watch on YouTube
      </a>
    </Card>
  );
}

export function ChannelCardSkeleton() {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-3 pr-8">
        <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>
      <Skeleton className="h-9 w-full rounded-md" />
    </Card>
  );
}
