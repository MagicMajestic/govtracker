import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface DailyActivity {
  date: string;
  messages: number;
  reactions: number;
  replies: number;
  total: number;
}

export function ActivityChart() {
  const { data: dailyStats, isLoading } = useQuery<DailyActivity[]>({
    queryKey: ["/api/activities/daily"],
    queryFn: () => fetch("/api/activities/daily?days=7").then(res => res.json())
  });

  if (isLoading) {
    return (
      <Card className="h-[400px]">
        <CardHeader>
          <CardTitle>Активность по дням</CardTitle>
          <CardDescription>Статистика активности за последние 7 дней</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = dailyStats?.map(stat => ({
    date: new Date(stat.date).toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit' 
    }),
    "Сообщения": stat.messages,
    "Реакции": stat.reactions,
    "Ответы": stat.replies
  })) || [];

  return (
    <Card className="h-[400px]">
      <CardHeader>
        <CardTitle>Активность по дням</CardTitle>
        <CardDescription>
          {dailyStats?.length ? 
            `Данные за последние ${dailyStats.length} дней` : 
            "Нет данных для отображения"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              labelStyle={{ color: '#000' }}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="Сообщения" 
              stroke="#8884d8" 
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="Реакции" 
              stroke="#82ca9d" 
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="Ответы" 
              stroke="#ffc658" 
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}