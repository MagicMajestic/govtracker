import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, BarChart3, Heart, Clock, RefreshCw } from "lucide-react";
import { ActivityChartEnhanced } from "@/components/activity-chart-enhanced";
import { ServerStatus } from "@/components/server-status";
import { TopCurators } from "@/components/top-curators";
import { RecentActivity } from "@/components/recent-activity";

export default function Dashboard() {
  const { data: stats, refetch, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 60000, // Refresh every minute
  });

  const formatDate = () => {
    return new Date().toLocaleDateString('ru-RU');
  };

  const statsCards = [
    {
      title: "Всего кураторов",
      value: stats?.totalCurators || 0,
      change: "+3",
      changeText: "за месяц",
      icon: Users,
      iconColor: "bg-blue-500/20 text-blue-500",
    },
    {
      title: "Сообщений сегодня",
      value: stats?.todayMessages || 0,
      change: "+12%",
      changeText: "чем вчера",
      icon: BarChart3,
      iconColor: "bg-green-500/20 text-green-500",
    },
    {
      title: "Реакций",
      value: stats?.todayReactions || 0,
      change: "+8%",
      changeText: "за неделю",
      icon: Heart,
      iconColor: "bg-orange-500/20 text-orange-500",
    },
    {
      title: "Среднее время ответа (мин)",
      value: "4.2",
      change: "+0.3",
      changeText: "чем обычно",
      icon: Clock,
      iconColor: "bg-yellow-500/20 text-yellow-500",
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="surface border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Панель управления</h2>
            <p className="text-sm text-gray-400">
              Последнее обновление: {new Date().toLocaleTimeString('ru-RU')}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Input
              type="date"
              defaultValue={formatDate()}
              className="bg-gray-800 border-gray-600 text-white"
            />
            <Button 
              onClick={() => refetch()} 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Обновить
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 scrollbar-thin">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card key={index} className="surface border-gray-700 bg-[#1c1c20]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.iconColor}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">{card.value}</p>
                      <p className="text-sm text-gray-400">{card.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-400 text-sm font-medium">{card.change}</span>
                    <span className="text-gray-400 text-sm ml-1">{card.changeText}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts and Status */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <ActivityChartEnhanced />
          <ServerStatus />
        </div>

        {/* Top Curators & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopCurators />
          <RecentActivity />
        </div>
      </main>
    </div>
  );
}
