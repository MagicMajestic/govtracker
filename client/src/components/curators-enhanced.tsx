import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Eye, Edit, Trash2, Clock, TrendingUp, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Curator {
  id: number;
  name: string;
  factions: string[];
  curatorType: string;
  discordId: string;
  isActive: boolean;
}

interface CuratorWithStats extends Curator {
  totalActivities: number;
  score: number;
  avgResponseTime?: number;
  activityStatus: "excellent" | "good" | "normal" | "poor";
}

function getActivityStatusText(status: string): string {
  switch (status) {
    case "excellent": return "Отличная активность";
    case "good": return "Хорошая активность";
    case "normal": return "Нормальная активность";
    case "poor": return "Низкая активность";
    default: return "Нет данных";
  }
}

function getActivityStatusColor(status: string): string {
  switch (status) {
    case "excellent": return "bg-green-500";
    case "good": return "bg-blue-500";
    case "normal": return "bg-yellow-500";
    case "poor": return "bg-red-500";
    default: return "bg-gray-500";
  }
}

function calculateActivityStatus(totalActivities: number): string {
  if (totalActivities >= 50) return "excellent";
  if (totalActivities >= 25) return "good";
  if (totalActivities >= 10) return "normal";
  return "poor";
}

export function CuratorsEnhanced() {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const { data: curators, isLoading } = useQuery<Curator[]>({
    queryKey: ["/api/curators"]
  });

  const { data: topCurators } = useQuery<CuratorWithStats[]>({
    queryKey: ["/api/curators/top"],
    queryFn: () => fetch("/api/curators/top?limit=100").then(res => res.json())
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/curators/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/curators"] });
      toast({ title: "Куратор удален", description: "Куратор был успешно удален." });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось удалить куратора.", variant: "destructive" });
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Кураторы</h1>
            <p className="text-muted-foreground">Управление кураторами Discord серверов</p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Merge curator data with stats
  const curatorsWithStats: CuratorWithStats[] = curators?.map(curator => {
    const stats = topCurators?.find(tc => tc.id === curator.id);
    const totalActivities = stats?.totalActivities || 0;
    
    return {
      ...curator,
      totalActivities,
      score: stats?.score || 0,
      avgResponseTime: stats?.avgResponseTime,
      activityStatus: calculateActivityStatus(totalActivities) as any
    };
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Кураторы</h1>
          <p className="text-muted-foreground">
            Управление {curators?.length || 0} кураторами Discord серверов
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить куратора
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {curatorsWithStats.map((curator) => (
          <Card key={curator.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {curator.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{curator.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {curator.curatorType === 'government' ? 'Государственный' : 'Криминальный'}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {curator.factions.map((faction, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {faction}
                      </Badge>
                    ))}
                  </div>

                  {/* Activity Status */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2">
                      <div className={`h-2 w-2 rounded-full ${getActivityStatusColor(curator.activityStatus)}`} />
                      <span className="text-xs font-medium">
                        {getActivityStatusText(curator.activityStatus)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      <span>{curator.totalActivities} активностей</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Ответ: {curator.avgResponseTime || "Н/Д"}</span>
                    </div>

                    {curator.score > 0 && (
                      <Progress value={curator.score} className="h-1" />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Link href={`/curators/${curator.id}`}>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-3 w-3 mr-1" />
                        Детали
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteMutation.mutate(curator.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!curators?.length && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Нет добавленных кураторов</p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить первого куратора
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}