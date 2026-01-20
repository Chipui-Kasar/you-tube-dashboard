import { Card } from "@/components/ui/card";

interface Channel {
  id: number;
  channel_name: string;
  youtube_channel_id: string;
  subscribers: number;
  views: number;
  thumbnail_url: string;
  rank: number;
}

export default function ChannelCard({ channel }: { channel: Channel }) {
  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary">
      <div className="relative p-2">
        {/* Channel Name */}
        <h3 className="text-sm font-semibold mb-3 text-foreground">{channel.channel_name}</h3>

        {/* Live Subscriber Counter */}
        <iframe 
          height="100px" 
          width="100%" 
          frameBorder="0" 
          src={`https://socialcounts.org/youtube-live-subscriber-count/${channel.youtube_channel_id}/embed`}
          style={{ border: "0", width: "100%", height: "100px" }}
        />

        {/* Stats */}
        <div className="space-y-2 mt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total Views</span>
            <span className="font-semibold text-foreground">
              <iframe 
                height="100px" 
                width="100%" 
                frameBorder="0" 
                src={`https://socialcounts.org/youtube-live-subscriber-count/${channel.youtube_channel_id}/embed?counter=0&fullscreen=true`}
                style={{ border: "0", width: "100%", height: "20px", fontSize:"16px" }}
              />
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
