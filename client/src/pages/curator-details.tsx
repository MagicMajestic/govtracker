import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { MessageSquare, Heart, Reply, ArrowLeft, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { getRatingText, getRatingColor } from "@/lib/rating";
import { formatTimeRussian } from "@/lib/timeFormat";
import { DatePickerWithRange, QuickDateRanges, DateTimeToggle } from "@/components/date-range-picker";
import { DateRange } from "react-day-picker";
import { useState, useCallback } from "react";

interface Curator {
  id: number;
  name: string;
  factions: string[];
  curatorType: string;
  discordId: string;
}

interface Activity {
  id: number;
  type: "message" | "reaction" | "reply" | "task_verification";
  content?: string;
  reactionEmoji?: string;
  channelName: string;
  timestamp: string;
  server: {
    name: string;
  };
}

interface CuratorStats {
  totalActivities: number;
  messages: number;
  reactions: number;
  replies: number;
  taskVerifications: number;
  score: number;
  avgResponseTime?: number;
}

function getActivityIcon(type: string) {
  switch (type) {
    case "message": return <MessageSquare className="h-4 w-4" />;
    case "reaction": return <Heart className="h-4 w-4" />;
    case "reply": return <Reply className="h-4 w-4" />;
    case "task_verification": return <CheckCircle className="h-4 w-4" />;
    default: return <MessageSquare className="h-4 w-4" />;
  }
}

function getActivityColor(type: string) {
  switch (type) {
    case "message": return "bg-blue-500";
    case "reaction": return "bg-red-500";
    case "reply": return "bg-green-500";
    case "task_verification": return "bg-purple-500";
    default: return "bg-gray-500";
  }
}



export default function CuratorDetails() {
  const { id } = useParams();
  const curatorId = parseInt(id || "0");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [showTime, setShowTime] = useState<boolean>(false);

  const handleDateRangeChange = useCallback((newDateRange: DateRange | undefined) => {
    setDateRange(newDateRange);
  }, []);

  const { data: curator } = useQuery<Curator>({
    queryKey: ["/api/curators", curatorId],
    queryFn: () => fetch(`/api/curators/${curatorId}`).then(res => res.json())
  });

  const { data: activities, refetch: refetchActivities } = useQuery<Activity[]>({
    queryKey: ["/api/activities/curator", curatorId],
    queryFn: () => fetch(`/api/activities/curator/${curatorId}`).then(res => res.json())
  });

  const { data: stats } = useQuery<CuratorStats>({
    queryKey: ["/api/curators/detailed-stats", curatorId, dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: () => {
      const params = new URLSearchParams();
      if (dateRange?.from) {
        params.append('from', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.append('to', dateRange.to.toISOString());
      }
      return fetch(`/api/curators/${curatorId}/detailed-stats?${params.toString()}`).then(res => res.json());
    },
    staleTime: 30000,
    refetchInterval: 10000
  });

  if (!curator) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Link href="/curators">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
          </Link>
        </div>
        <div className="text-center text-muted-foreground py-8">
          Куратор не найден
        </div>
      </div>
    );
  }

  const score = stats?.score || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/curators">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к кураторам
          </Button>
        </Link>
      </div>

      {/* Date Range Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 bg-gray-800/50 rounded-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <span className="text-sm text-gray-300 font-medium">Период активности:</span>
          <DatePickerWithRange 
            date={dateRange}
            onDateChange={handleDateRangeChange}
            showTime={showTime}
          />
          <DateTimeToggle 
            showTime={showTime}
            onToggle={setShowTime}
          />
        </div>
        <QuickDateRanges onDateChange={handleDateRangeChange} />
      </div>

      {/* Curator Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-2xl">
                {curator.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">{curator.name}</CardTitle>
              <CardDescription className="text-lg">
                {curator.curatorType === 'government' ? 'Государственный куратор' : 'Криминальный куратор'}
              </CardDescription>
              <div className="flex flex-wrap gap-2 mt-2">
                {curator.factions.map((faction, i) => (
                  <Badge key={i} variant="outline">{faction}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Performance Score */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Рейтинг производительности</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-24 ${getRatingColor(score)} rounded-full`}>
                  <div 
                    className="h-full bg-white/30 rounded-full" 
                    style={{ width: `${100 - score}%` }}
                  />
                </div>
                <span className="text-lg font-bold">{score}</span>
              </div>
              <p className="text-sm text-muted-foreground">{getRatingText(score)}</p>
            </div>

            {/* Response Time */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Среднее время ответа</span>
              </div>
              <p className="text-lg font-bold">
                {stats?.avgResponseTime ? formatTimeRussian(Math.round(stats.avgResponseTime)) : "Н/Д"}
              </p>
              <p className="text-sm text-muted-foreground">
                {stats?.avgResponseTime ? "Быстрое реагирование" : "Нет данных"}
              </p>
            </div>

            {/* Total Activity */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm font-medium">Общая активность</span>
              </div>
              <p className="text-lg font-bold">{stats?.totalActivities || 0}</p>
              <p className="text-sm text-muted-foreground">
                {stats?.messages || 0} сообщ. • {stats?.reactions || 0} реакц. • {stats?.replies || 0} ответов
              </p>
              {stats?.taskVerifications ? (
                <p className="text-sm text-green-400 font-medium">
                  Проверено задач: {stats.taskVerifications}
                </p>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Лента активности</CardTitle>
            <CardDescription>
              Хронология всех действий куратора
            </CardDescription>
          </div>
          <Button onClick={() => refetchActivities()} variant="outline" size="sm">
            Обновить
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {activities?.map((activity, index) => (
              <div key={activity.id} className="relative">
                {/* Timeline line */}
                {index < (activities.length - 1) && (
                  <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-border" />
                )}
                
                <div className="flex items-start space-x-4">
                  {/* Activity Icon */}
                  <div className={`relative flex-shrink-0 w-8 h-8 rounded-full ${getActivityColor(activity.type)} flex items-center justify-center`}>
                    <div className="text-white text-xs">
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>
                  
                  {/* Activity Content */}
                  <div className="flex-1 min-w-0 pb-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium">
                        {activity.type === "message" && "Отправил сообщение"}
                        {activity.type === "reaction" && `Поставил реакцию ${activity.reactionEmoji}`}
                        {activity.type === "reply" && "Ответил на сообщение"}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        #{activity.channelName}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mb-2">
                      {activity.server.name} • {formatDistanceToNow(new Date(activity.timestamp), { 
                        addSuffix: true, 
                        locale: ru 
                      })}
                    </div>
                    
                    {activity.content && (
                      <div className="mt-2 p-3 bg-muted rounded-lg text-sm">
                        {activity.content}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {!activities?.length && (
              <div className="text-center text-muted-foreground py-8">
                Нет активности для отображения
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}