import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Clock, 
  MessageCircle, 
  Heart, 
  Reply, 
  Users, 
  Server,
  TrendingUp,
  Activity,
  Settings,
  Save
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ServerData {
  id: number;
  serverId: string;
  name: string;
  roleTagId: string | null;
  isActive: boolean;
}

interface ServerStats {
  id: number;
  serverId: string;
  name: string;
  isActive: boolean;
  totalActivities: number;
  messages: number;
  reactions: number;
  replies: number;
  avgResponseTime: number | null;
  topCurators: {
    name: string;
    activities: number;
    factions: string[];
  }[];
}

export function ServersEnhanced() {
  const [editingServer, setEditingServer] = useState<ServerData | null>(null);
  const [roleTagId, setRoleTagId] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: servers = [], isLoading } = useQuery<ServerData[]>({
    queryKey: ["/api/servers"],
    staleTime: 5000,
    refetchInterval: 10000,
  });

  const { data: serverStats = [], isLoading: statsLoading } = useQuery<ServerStats[]>({
    queryKey: ["/api/servers/stats"],
    staleTime: 5000,
    refetchInterval: 10000,
  });

  const updateServerMutation = useMutation({
    mutationFn: async (data: { id: number; roleTagId: string }) => {
      return await fetch(`/api/servers/${data.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roleTagId: data.roleTagId }),
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/servers"] });
      toast({
        title: "Сервер обновлён",
        description: "ID роли кураторов успешно сохранён",
      });
      setEditingServer(null);
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить изменения",
        variant: "destructive",
      });
    },
  });

  const handleEditServer = (server: ServerData) => {
    setEditingServer(server);
    setRoleTagId(server.roleTagId || "");
  };

  const handleSaveServer = () => {
    if (editingServer) {
      updateServerMutation.mutate({
        id: editingServer.id,
        roleTagId: roleTagId,
      });
    }
  };

  if (isLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Create stats map for easier lookup
  const statsMap = new Map(serverStats.map((stat: ServerStats) => [stat.id, stat]));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Discord серверы</h1>
          <p className="text-gray-600">Мониторинг активности кураторов по серверам</p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Server className="w-4 h-4 mr-2" />
          {servers.length} серверов
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servers.map((server) => {
          const stats = statsMap.get(server.id);
          
          return (
            <Card key={server.id} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">
                    {server.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditServer(server)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Настройки сервера {server.name}</DialogTitle>
                          <DialogDescription>
                            Настройте ID роли кураторов для автоматического мониторинга
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="role-id">ID роли кураторов</Label>
                            <Input
                              id="role-id"
                              placeholder="Например: 123456789012345678"
                              value={roleTagId}
                              onChange={(e) => setRoleTagId(e.target.value)}
                            />
                            <p className="text-sm text-gray-500">
                              Введите ID роли Discord, которую имеют кураторы на этом сервере
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label>Текущие данные сервера</Label>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>ID сервера: {server.serverId}</div>
                              <div>Текущая роль: {server.roleTagId || "Не установлена"}</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={handleSaveServer}
                            disabled={updateServerMutation.isPending}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {updateServerMutation.isPending ? "Сохранение..." : "Сохранить"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Badge 
                      variant={server.isActive ? "default" : "secondary"}
                      className={server.isActive ? "bg-green-500" : "bg-gray-500"}
                    >
                      {server.isActive ? "Активен" : "Неактивен"}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="text-sm text-gray-500 space-y-1">
                  <div>ID: {server.serverId}</div>
                  {server.roleTagId && (
                    <div>Роль кураторов: {server.roleTagId}</div>
                  )}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {stats ? (
                  <>
                    {/* Activity Summary */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <Activity className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                        <div className="text-sm font-medium text-blue-900">
                          {stats.totalActivities}
                        </div>
                        <div className="text-xs text-blue-600">Всего действий</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <Clock className="w-5 h-5 mx-auto mb-1 text-green-600" />
                        <div className="text-sm font-medium text-green-900">
                          {stats.avgResponseTime ? `${stats.avgResponseTime}с` : "—"}
                        </div>
                        <div className="text-xs text-green-600">Ср. время ответа</div>
                      </div>
                    </div>

                    {/* Activity Types */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <MessageCircle className="w-4 h-4 text-blue-500" />
                          <span className="text-sm">Сообщения</span>
                        </div>
                        <Badge variant="outline">{stats.messages}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Heart className="w-4 h-4 text-red-500" />
                          <span className="text-sm">Реакции</span>
                        </div>
                        <Badge variant="outline">{stats.reactions}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Reply className="w-4 h-4 text-green-500" />
                          <span className="text-sm">Ответы</span>
                        </div>
                        <Badge variant="outline">{stats.replies}</Badge>
                      </div>
                    </div>

                    <Separator />

                    {/* Top Curators */}
                    <div>
                      <h4 className="text-sm font-medium mb-3 flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        Активные кураторы
                      </h4>
                      {stats.topCurators && stats.topCurators.length > 0 ? (
                        <div className="space-y-2">
                          {stats.topCurators.slice(0, 3).map((curator, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-800">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="text-sm font-medium">{curator.name}</div>
                                  <div className="text-xs text-gray-500">
                                    {curator.factions.join(", ")}
                                  </div>
                                </div>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {curator.activities}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-3 text-gray-500 text-sm">
                          Нет активных кураторов
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Server className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">Статистика недоступна</div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Общая статистика серверов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {serverStats.reduce((sum, stat) => sum + stat.totalActivities, 0)}
              </div>
              <div className="text-sm text-gray-600">Всего действий</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {serverStats.reduce((sum, stat) => sum + stat.messages, 0)}
              </div>
              <div className="text-sm text-gray-600">Сообщений</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {serverStats.reduce((sum: number, stat: ServerStats) => sum + stat.reactions, 0)}
              </div>
              <div className="text-sm text-gray-600">Реакций</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {serverStats.reduce((sum: number, stat: ServerStats) => sum + stat.replies, 0)}
              </div>
              <div className="text-sm text-gray-600">Ответов</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}