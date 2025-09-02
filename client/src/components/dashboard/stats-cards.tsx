import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Users, FileText, Calendar, ArrowUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsConfig = [
    {
      title: "Active Jobs",
      value: (stats as any)?.activeJobs || 0,
      change: "+2 this week",
      icon: Briefcase,
      bgColor: "bg-gradient-to-br from-blue-500/10 to-cyan-500/10",
      iconColor: "text-blue-600",
      changeColor: "text-green-600",
      emoji: "💼",
    },
    {
      title: "Total Candidates", 
      value: (stats as any)?.totalCandidates || 0,
      change: "+15 this week",
      icon: Users,
      bgColor: "bg-gradient-to-br from-green-500/10 to-emerald-500/10", 
      iconColor: "text-green-600",
      changeColor: "text-green-600",
      emoji: "👥",
    },
    {
      title: "Pending Applications",
      value: (stats as any)?.pendingApplications || 0,
      change: "Requires review",
      icon: FileText,
      bgColor: "bg-gradient-to-br from-orange-500/10 to-yellow-500/10",
      iconColor: "text-orange-600",
      changeColor: "text-orange-600",
      showClock: true,
      emoji: "📋",
    },
    {
      title: "Interviews Today",
      value: (stats as any)?.todayInterviews || 0,
      change: "3 upcoming",
      icon: Calendar,
      bgColor: "bg-gradient-to-br from-purple-500/10 to-pink-500/10",
      iconColor: "text-purple-600",
      changeColor: "text-purple-600",
      emoji: "🗓️",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="stats-cards">
      {statsConfig.map((stat, index) => (
        <Card 
          key={stat.title}
          className="border-0 shadow-xl backdrop-blur-lg bg-white/90 hover:shadow-2xl transform transition-all duration-300 hover:scale-105 rounded-2xl overflow-hidden"
          style={{ animationDelay: `${index * 0.1}s` }}
          data-testid={`stat-card-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <div className={`h-2 ${stat.bgColor}`}></div>
          <CardContent className="pt-6 pb-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
              <div className="text-2xl">{stat.emoji}</div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-3xl font-black text-gray-900" data-testid={`stat-value-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                {stat.value}
              </p>
              <div className="flex items-center space-x-1">
                <ArrowUp className={`w-4 h-4 ${stat.changeColor}`} />
                <p className={`text-sm font-semibold ${stat.changeColor}`}>{stat.change}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}