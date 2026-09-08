import { Card } from "@/components/ui/card";
import { formatCompactNumber } from "@/lib/utils";
import { Eye, Tv, Users, type LucideIcon } from "lucide-react";

interface SummaryBarProps {
  totalSubscribers: number;
  totalViews: number;
  channelCount: number;
}

interface Stat {
  label: string;
  value: string;
  icon: LucideIcon;
  gradient: string;
  iconColor: string;
}

export default function SummaryBar({
  totalSubscribers,
  totalViews,
  channelCount,
}: SummaryBarProps) {
  const stats: Stat[] = [
    {
      label: "Total Subscribers",
      value: formatCompactNumber(totalSubscribers),
      icon: Users,
      gradient: "from-primary/10 to-primary/5",
      iconColor: "text-primary",
    },
    {
      label: "Total Views",
      value: formatCompactNumber(totalViews),
      icon: Eye,
      gradient: "from-accent/10 to-accent/5",
      iconColor: "text-accent",
    },
    {
      label: "Channels Tracked",
      value: channelCount.toString(),
      icon: Tv,
      gradient: "from-emerald-500/10 to-emerald-500/5",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className={`bg-gradient-to-br ${stat.gradient} p-6`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {stat.value}
              </p>
            </div>
            <stat.icon className={`size-9 opacity-70 ${stat.iconColor}`} />
          </div>
        </Card>
      ))}
    </div>
  );
}
