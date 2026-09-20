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

// Both live-counter providers use the same shape of layout: an avatar on
// the left, and a name+number text column to its right (name on top,
// number below). We only want the number, so each iframe is rendered at
// its own natural size and shifted up-left inside a clipped wrapper so
// just the number cell is visible. The two providers use different fixed
// pixel layouts, so each needs its own calibrated offsets.
// The number itself renders at a fixed font size inside the widget, so
// giving it more container width only reduces truncation — it doesn't make
// the digits bigger. Scaling the cropped view up (zoomed from the number's
// own top-left corner, so it grows in place) makes it visibly larger. Both
// providers are scaled to the same on-screen number height so rows stay a
// consistent size regardless of which provider a given channel uses.
const TARGET_NUMBER_HEIGHT = 48.6;

const PROVIDER_LAYOUT = {
  socialcounts: {
    widgetWidth: 340,
    widgetHeight: 98,
    numberLeft: 114,
    numberTop: 47,
    numberNaturalHeight: 36,
    // socialcounts renders a dark card already; neutralize its blue tint.
    filterClassName: "grayscale-[35%] contrast-125",
  },
  livecounts: {
    widgetWidth: 340,
    widgetHeight: 80,
    numberLeft: 88,
    numberTop: 37,
    numberNaturalHeight: 41,
    // livecounts always renders on a hardcoded white background with black
    // text (it doesn't follow a dark theme like socialcounts does), so it
    // never matches the dark-pill look. Inverting flips white↔black,
    // turning it into a dark card with light text to match.
    filterClassName: "invert contrast-125",
  },
} as const;

export default function ChannelCard({
  channel,
  metric,
  isPulsing,
}: {
  channel: Channel;
  metric: "subscribers" | "views";
  isPulsing?: boolean;
}) {
  const rankStyle =
    RANK_STYLES[channel.rank] ?? "bg-primary text-primary-foreground";
  const liveUrl = `https://www.youtube.com/channel/${channel.youtube_channel_id}/live`;

  const provider =
    channel.source === "mixerno"
      ? "mixerno"
      : channel.source === "livecounts"
        ? "livecounts"
        : "socialcounts";

  const iframeLayout =
    provider === "mixerno" ? null : PROVIDER_LAYOUT[provider];
  const numberScale = iframeLayout
    ? TARGET_NUMBER_HEIGHT / iframeLayout.numberNaturalHeight
    : 1;
  const counterUrl =
    provider === "livecounts"
      ? `https://livecounts.io/embed/youtube-live-${metric === "views" ? "view" : "subscriber"}-counter/${channel.youtube_channel_id}`
      : provider === "socialcounts"
        ? metric === "views"
          ? `https://socialcounts.org/youtube-live-subscriber-count/${channel.youtube_channel_id}/embed?counter=0`
          : `https://socialcounts.org/youtube-live-subscriber-count/${channel.youtube_channel_id}/embed`
        : null;
  // mixerno stats are batch-fetched server-side (see /api/channels) and
  // arrive on the channel object itself, same as the other stat sources.
  const mixernoValue = metric === "views" ? channel.views : channel.subscribers;

  return (
    <Card
      className="animate-row-enter group relative flex flex-row items-center gap-3 p-3 transition-all duration-200 hover:border-primary/50 hover:bg-muted/40 hover:shadow-md"
      style={{ animationDelay: `${Math.min(channel.rank * 30, 400)}ms` }}
    >
      {isPulsing && (
        <div
          className="fire-glow pointer-events-none absolute -inset-3 -z-10 rounded-xl blur-md"
          style={{
            background:
              "radial-gradient(55% 100% at 18% 100%, rgba(255,138,0,0.65), transparent 60%), radial-gradient(50% 95% at 52% 100%, rgba(255,55,0,0.6), transparent 55%), radial-gradient(45% 90% at 84% 100%, rgba(255,196,0,0.55), transparent 55%)",
          }}
        />
      )}

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
          className="relative flex w-full max-w-[240px] items-center overflow-hidden rounded-md bg-neutral-900 ring-1 ring-inset ring-border/50"
          style={{ height: TARGET_NUMBER_HEIGHT }}
        >
          {provider === "mixerno" ? (
            <span className="truncate px-2.5 text-3xl font-bold text-white">
              {mixernoValue !== null && mixernoValue !== undefined
                ? mixernoValue.toLocaleString("en-US")
                : "…"}
            </span>
          ) : (
            iframeLayout && (
              <iframe
                key={`${provider}-${metric}`}
                title={`${channel.channel_name} live ${metric === "views" ? "view" : "subscriber"} count`}
                src={counterUrl ?? undefined}
                scrolling="no"
                className={`absolute border-0 ${iframeLayout.filterClassName}`}
                style={{
                  top: -iframeLayout.numberTop,
                  left: -iframeLayout.numberLeft,
                  width: iframeLayout.widgetWidth,
                  height: iframeLayout.widgetHeight,
                  transform: `scale(${numberScale})`,
                  transformOrigin: `${iframeLayout.numberLeft}px ${iframeLayout.numberTop}px`,
                }}
              />
            )
          )}
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
