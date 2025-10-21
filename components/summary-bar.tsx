import { Card } from "@/components/ui/card";

interface SummaryBarProps {
  totalSubscribers: number;
  totalViews: number;
}

export default function SummaryBar({
  totalSubscribers,
  totalViews,
}: SummaryBarProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Total Subscribers
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {formatNumber(totalSubscribers)}
            </p>
          </div>
          <div className="text-4xl text-primary opacity-20">👥</div>
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-accent/10 to-accent/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Total Views
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {formatNumber(totalViews)}
            </p>
          </div>
          <div className="text-4xl text-accent opacity-20">👁️</div>
        </div>
      </Card>
    </div>
  );
}
