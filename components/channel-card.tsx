import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Youtube } from "lucide-react";

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
  1: "bg-gradient-to-br from-yellow-400 to-amber-500 text-amber-950 ring-2 ring-yellow-400/40",
  2: "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900 ring-2 ring-slate-300/40",
  3: "bg-gradient-to-br from-amber-600 to-amber-800 text-amber-50 ring-2 ring-amber-600/40",
};

// The live-counter widget is a fixed layout: a 96px avatar on the left, and
// a name+number text column to its right (name on top, number below). We
// only want the number, so the iframe is rendered at a fixed natural width
// (wide enough that the widget never truncates the number) and shifted up
// and left inside a clipped wrapper so just the number cell is visible.
const WIDGET_WIDTH = 340;
const WIDGET_HEIGHT = 98;
const NUMBER_COL_LEFT_OFFSET = 114;
const NUMBER_ROW_TOP_OFFSET = 47;
// The number itself renders at a fixed font size inside the widget, so
// giving it more container width only reduces truncation — it doesn't make
// the digits bigger. Scaling the cropped view up (zoomed from its top-left
// corner, where the crop already starts) makes the number visibly larger.
const NUMBER_SCALE = 1.35;
const NUMBER_ROW_HEIGHT = 36 * NUMBER_SCALE;

export default function ChannelCard({
  channel,
  metric,
}: {
  channel: Channel;
  metric: "subscribers" | "views";
}) {
  const rankStyle =
    RANK_STYLES[channel.rank] ?? "bg-primary text-primary-foreground";
  const liveUrl = `https://www.youtube.com/channel/${channel.youtube_channel_id}/live`;
  const counterUrl =
    metric === "views"
      ? `https://socialcounts.org/youtube-live-subscriber-count/${channel.youtube_channel_id}/embed?counter=0`
      : `https://socialcounts.org/youtube-live-subscriber-count/${channel.youtube_channel_id}/embed`;

  return (
    <Card
      className="animate-row-enter group flex flex-row items-center gap-3 p-3 transition-all duration-200 hover:border-primary/50 hover:bg-muted/40 hover:shadow-md"
      style={{ animationDelay: `${Math.min(channel.rank * 30, 400)}ms` }}
    >
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${rankStyle}`}
      >
        {channel.rank === 1 ? (
          <Crown className="size-3.5 fill-current" />
        ) : (
          channel.rank
        )}
      </div>

      <img
        src={channel.thumbnail_url || "/placeholder.svg"}
        alt={channel.channel_name}
        className="h-16 w-16 shrink-0 rounded-lg border border-border object-cover transition-transform duration-200 group-hover:scale-105 sm:h-20 sm:w-20"
        referrerPolicy="no-referrer"
        onError={(e) => {
          const img = e.currentTarget;
          const originalSrc = channel.thumbnail_url || "/placeholder.svg";
          if (!channel.thumbnail_url || img.dataset.retried) {
            img.src = "/placeholder.svg";
            return;
          }
          // Transient load failures (network blip, connection-pool
          // congestion from many thumbnails loading at once) happen
          // occasionally on real CDN images — retry the same URL once,
          // after a short delay, before giving up.
          img.dataset.retried = "1";
          setTimeout(() => {
            img.src = originalSrc;
          }, 800 + Math.random() * 800);
        }}
      />

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-xl font-bold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-2xl">
          {channel.channel_name}
        </h3>
        <div className="mb-0.5 flex items-center gap-1">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-red-600" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-500">
            Live {metric === "views" ? "views" : "subscribers"}
          </span>
        </div>
        <div
          className="relative w-full max-w-[240px] overflow-hidden rounded-md ring-1 ring-inset ring-border/50"
          style={{ height: NUMBER_ROW_HEIGHT }}
        >
          <iframe
            key={metric}
            title={`${channel.channel_name} live ${metric === "views" ? "view" : "subscriber"} count`}
            src={counterUrl}
            scrolling="no"
            className="absolute grayscale-[35%] contrast-125 border-0"
            style={{
              top: -NUMBER_ROW_TOP_OFFSET,
              left: -NUMBER_COL_LEFT_OFFSET,
              width: WIDGET_WIDTH,
              height: WIDGET_HEIGHT,
              transform: `scale(${NUMBER_SCALE})`,
              transformOrigin: `${NUMBER_COL_LEFT_OFFSET}px ${NUMBER_ROW_TOP_OFFSET}px`,
            }}
          />
        </div>
      </div>

      <a
        href={liveUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Watch on YouTube"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-600 text-white shadow-sm transition-all duration-200 hover:scale-110 hover:bg-red-700 hover:shadow-md"
      >
        <Youtube className="size-4 shrink-0" />
      </a>
    </Card>
  );
}

export function ChannelCardSkeleton() {
  return (
    <Card className="flex flex-row items-center gap-3 p-3">
      <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
      <Skeleton className="h-16 w-16 shrink-0 rounded-lg sm:h-20 sm:w-20" />
      <div className="min-w-0 flex-1">
        <Skeleton className="mb-1.5 h-6 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
      </div>
      <Skeleton className="size-9 shrink-0 rounded-full" />
    </Card>
  );
}
