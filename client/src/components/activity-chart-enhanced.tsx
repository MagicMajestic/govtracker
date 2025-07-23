import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DailyActivity {
  date: string;
  messages: string;
  reactions: string; 
  replies: string;
}

interface ChartDataPoint {
  date: string;
  messages: number;
  reactions: number;
  replies: number;
  total: number;
}

type PeriodType = 'day' | 'week' | 'month';

export function ActivityChartEnhanced() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('week');
  
  const { data: rawData, isLoading } = useQuery<DailyActivity[]>({
    queryKey: ["/api/activities/daily"]
  });

  // Transform data for chart display
  const activityData: ChartDataPoint[] = rawData?.map(item => ({
    date: new Date(item.date).toLocaleDateString('ru-RU', { 
      month: 'short', 
      day: 'numeric' 
    }),
    messages: parseInt(item.messages || '0'),
    reactions: parseInt(item.reactions || '0'),
    replies: parseInt(item.replies || '0'),
    total: parseInt(item.messages || '0') + parseInt(item.reactions || '0') + parseInt(item.replies || '0')
  })) || [];

  const periods = [
    { key: 'day' as PeriodType, label: 'День', active: selectedPeriod === 'day' },
    { key: 'week' as PeriodType, label: 'Неделя', active: selectedPeriod === 'week' },
    { key: 'month' as PeriodType, label: 'Месяц', active: selectedPeriod === 'month' },
  ];

  // Calculate totals
  const totalInteractions = activityData?.reduce((sum, item) => sum + item.total, 0) || 0;
  
  if (isLoading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Активность по дням</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-muted-foreground">Загрузка данных...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">Активность по дням</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Всего взаимодействий: <span className="font-medium">{totalInteractions}</span>
            </p>
          </div>
          <div className="flex space-x-1">
            {periods.map((period) => (
              <Button
                key={period.key}
                variant={period.active ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(period.key)}
                className={`h-8 px-3 ${
                  period.active 
                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                    : "hover:bg-gray-100"
                }`}
              >
                {period.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={activityData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                labelStyle={{ color: '#D1D5DB' }}
              />
              <Legend />
              <Bar 
                dataKey="messages" 
                stackId="a" 
                fill="#3B82F6" 
                name="Сообщения"
                radius={[0, 0, 4, 4]}
              />
              <Bar 
                dataKey="reactions" 
                stackId="a" 
                fill="#10B981" 
                name="Реакции"
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="replies" 
                stackId="a" 
                fill="#F59E0B" 
                name="Ответы"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {(!activityData || activityData.length === 0) && (
          <div className="flex items-center justify-center h-80">
            <div className="text-center text-muted-foreground">
              <p className="mb-2">Нет данных об активности</p>
              <p className="text-sm">Данные появятся после первой активности кураторов</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}