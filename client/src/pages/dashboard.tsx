import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BarChart3, Heart, Clock, RefreshCw } from "lucide-react";
import { ActivityChartEnhanced } from "@/components/activity-chart-enhanced";
import { TopCurators } from "@/components/top-curators";
import { RecentActivity } from "@/components/recent-activity";
import { DatePickerWithRange, QuickDateRanges, DateTimeToggle } from "@/components/date-range-picker";
import { useState } from "react";
import { DateRange } from "react-day-picker";

interface DashboardStats {
  totalCurators: number;
  todayMessages: string;
  todayReactions: string;
  todayReplies: string;
  avgResponseTime: string;
  // Изменения по сравнению с предыдущими периодами
  curatorsChange: number;
  messagesChange: number;
  reactionsChange: number;
  responseTimeChange: number;
}

export default function Dashboard() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [showTime, setShowTime] = useState<boolean>(false);
  
  const { data: stats, refetch, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats", dateRange],
    queryFn: () => {
      const params = new URLSearchParams();
      if (dateRange?.from) {
        params.append('dateFrom', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.append('dateTo', dateRange.to.toISOString());
      }
      return fetch(`/api/dashboard/stats?${params.toString()}`).then(res => res.json());
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Функция для форматирования изменений
  const formatChange = (value: number, isPercent: boolean = true, isTime: boolean = false) => {
    if (value === 0) return "0";
    const prefix = value > 0 ? "+" : "";
    if (isTime) {
      return `${prefix}${value}с`;
    }
    return isPercent ? `${prefix}${value}%` : `${prefix}${value}`;
  };

  // Функция для определения цвета изменения
  const getChangeColor = (value: number, reverseColors: boolean = false) => {
    if (value === 0) return "text-gray-400";
    const isPositive = value > 0;
    if (reverseColors) {
      return isPositive ? "text-red-400" : "text-green-400";
    }
    return isPositive ? "text-green-400" : "text-red-400";
  };

  const statsCards = [
    {
      title: "Всего кураторов",
      value: stats?.totalCurators || 0,
      change: formatChange(stats?.curatorsChange || 0, false),
      changeText: "за месяц",
      changeColor: getChangeColor(stats?.curatorsChange || 0),
      icon: Users,
      iconColor: "bg-blue-500/20 text-blue-500",
    },
    {
      title: "Сообщений сегодня",
      value: stats?.todayMessages || "0",
      change: formatChange(stats?.messagesChange || 0),
      changeText: "чем вчера",
      changeColor: getChangeColor(stats?.messagesChange || 0),
      icon: BarChart3,
      iconColor: "bg-green-500/20 text-green-500",
    },
    {
      title: "Реакций",
      value: stats?.todayReactions || "0",
      change: formatChange(stats?.reactionsChange || 0),
      changeText: "за неделю",
      changeColor: getChangeColor(stats?.reactionsChange || 0),
      icon: Heart,
      iconColor: "bg-orange-500/20 text-orange-500",
    },
    {
      title: "Среднее время ответа",
      value: `${stats?.avgResponseTime || 0}с`,
      change: formatChange(stats?.responseTimeChange || 0, false, true),
      changeText: stats?.responseTimeChange && stats.responseTimeChange < 0 ? "быстрее" : "медленнее",
      changeColor: getChangeColor(stats?.responseTimeChange || 0, true), // Обратные цвета для времени
      icon: Clock,
      iconColor: "bg-yellow-500/20 text-yellow-500",
    },
  ];

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Header */}
      <header className="surface border-b border-gray-700 px-6 py-4 sticky top-0 z-10">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Панель управления</h2>
              <p className="text-sm text-gray-400">
                Последнее обновление: {new Date().toLocaleTimeString('ru-RU')}
              </p>
            </div>
            <div className="flex items-center space-x-4">
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

          {/* Date Range Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <span className="text-sm text-gray-300 font-medium">Период активности:</span>
              <DatePickerWithRange 
                date={dateRange}
                onDateChange={setDateRange}
                showTime={showTime}
              />
              <DateTimeToggle 
                showTime={showTime}
                onToggle={setShowTime}
              />
            </div>
            <QuickDateRanges onDateChange={setDateRange} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 space-y-8">
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
                    <span className={`${card.changeColor} text-sm font-medium`}>{card.change}</span>
                    <span className="text-gray-400 text-sm ml-1">{card.changeText}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Section - Убрали ServerStatus */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-3">
            <ActivityChartEnhanced />
          </div>
        </div>

        {/* Top Curators & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopCurators dateRange={dateRange} />
          <RecentActivity />
        </div>
      </main>
    </div>
  );
}