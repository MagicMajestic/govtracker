import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export function ActivityChart() {
  const [period, setPeriod] = useState("7");

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // Mock chart data for now - in a real implementation you'd query daily activity
  const chartData = [
    { day: "Пн", height: 60, value: 120 },
    { day: "Вт", height: 120, value: 240 },
    { day: "Ср", height: 180, value: 360 },
    { day: "Чт", height: 90, value: 180 },
    { day: "Пт", height: 150, value: 300 },
    { day: "Сб", height: 80, value: 160 },
    { day: "Вс", height: 50, value: 100 },
  ];

  return (
    <Card className="surface border-gray-700 lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-white">Активность по дням</CardTitle>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48 bg-gray-800 border-gray-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            <SelectItem value="7" className="text-white">Последние 7 дней</SelectItem>
            <SelectItem value="30" className="text-white">Последние 30 дней</SelectItem>
            <SelectItem value="90" className="text-white">Последние 3 месяца</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="chart-container rounded-lg p-4 h-64 flex items-end justify-between space-x-2">
          {chartData.map((item, index) => (
            <div key={index} className="flex flex-col items-center space-y-2 group">
              <div 
                className="w-8 bg-white/30 group-hover:bg-white/50 rounded-t transition-all duration-200 cursor-pointer"
                style={{ height: `${item.height}px` }}
                title={`${item.day}: ${item.value} действий`}
              />
              <span className="text-xs text-white/70">{item.day}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
