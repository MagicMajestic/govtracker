import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface TopCurator {
  id: number;
  name: string;
  factions: string[];
  score: number;
  totalActivities: number;
  messages: number;
  reactions: number;
  replies: number;
}

function getRatingText(score: number): string {
  if (score >= 90) return "Великолепно";
  if (score >= 70) return "Хорошо";
  if (score >= 50) return "Нормально";
  if (score >= 30) return "Плохо";
  return "Ужасно";
}

function getRatingColor(score: number): string {
  if (score >= 90) return "bg-green-500";
  if (score >= 70) return "bg-blue-500";
  if (score >= 50) return "bg-yellow-500";
  if (score >= 30) return "bg-orange-500";
  return "bg-red-500";
}

export function TopCurators() {
  const [showAll, setShowAll] = useState(false);
  
  const { data: topCurators, isLoading } = useQuery<TopCurator[]>({
    queryKey: ["/api/curators/top"],
    queryFn: () => fetch("/api/curators/top?limit=50").then(res => res.json())
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Топ кураторы</CardTitle>
          <CardDescription>Рейтинг самых активных кураторов</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const displayedCurators = showAll ? (topCurators || []) : (topCurators || []).slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Топ кураторы</CardTitle>
        <CardDescription>
          {topCurators?.length ? 
            `Рейтинг на основе ${topCurators.reduce((sum, c) => sum + c.totalActivities, 0)} активностей` : 
            "Нет данных для отображения"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayedCurators.map((curator, index) => (
            <div key={curator.id} className="flex items-center space-x-4">
              <div className="relative">
                <Avatar>
                  <AvatarFallback>
                    {curator.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-1 -left-1 h-5 w-5 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center font-bold">
                  {index + 1}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{curator.name}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {curator.factions.map((faction, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {faction}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {curator.messages} сообщ. • {curator.reactions} реакц. • {curator.replies} ответов
                </p>
              </div>
              
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <div className={`h-2 w-16 ${getRatingColor(curator.score)} rounded-full`}>
                    <div 
                      className="h-full bg-white/30 rounded-full" 
                      style={{ width: `${100 - curator.score}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold">{curator.score}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {getRatingText(curator.score)}
                </p>
              </div>
            </div>
          ))}
          
          {(topCurators?.length || 0) > 5 && (
            <Button 
              variant="ghost" 
              className="w-full mt-4" 
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? "Скрыть" : "Показать всех"} ({topCurators?.length || 0})
            </Button>
          )}
          
          {!topCurators?.length && (
            <div className="text-center text-muted-foreground py-8">
              Нет активных кураторов для отображения
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}