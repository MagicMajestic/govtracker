import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Settings, Save, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DiscordServer {
  id: number;
  serverId: string;
  name: string;
  roleTagId?: string;
  isActive: boolean;
}

export function ServerSettings() {
  const { toast } = useToast();
  const [editingServer, setEditingServer] = useState<number | null>(null);
  const [roleTagId, setRoleTagId] = useState<string>("");

  const { data: servers, isLoading } = useQuery<DiscordServer[]>({
    queryKey: ["/api/servers"]
  });

  const updateServerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { roleTagId: string } }) => {
      const response = await apiRequest("PUT", `/api/servers/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/servers"] });
      toast({ title: "Успешно", description: "Настройки сервера обновлены." });
      setEditingServer(null);
      setRoleTagId("");
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось обновить настройки сервера.", variant: "destructive" });
    }
  });

  const startEditing = (server: DiscordServer) => {
    setEditingServer(server.id);
    setRoleTagId(server.roleTagId || "");
  };

  const saveSettings = (serverId: number) => {
    if (!roleTagId.trim()) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, укажите ID роли для тегирования кураторов",
        variant: "destructive",
      });
      return;
    }
    updateServerMutation.mutate({ id: serverId, data: { roleTagId: roleTagId.trim() } });
  };

  const cancelEditing = () => {
    setEditingServer(null);
    setRoleTagId("");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Настройки серверов</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-100 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Settings className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Настройки серверов</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Настройка ID ролей для отслеживания времени ответа кураторов
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span>Для расчета времени ответа укажите ID роли, которая тегирует кураторов</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servers?.map((server) => (
          <Card key={server.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{server.name}</CardTitle>
                <Badge variant={server.isActive ? "default" : "secondary"}>
                  {server.isActive ? "Активен" : "Неактивен"}
                </Badge>
              </div>
              <CardDescription className="text-xs font-mono">
                ID: {server.serverId}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {editingServer === server.id ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor={`role-${server.id}`}>ID роли для тегирования</Label>
                    <Input
                      id={`role-${server.id}`}
                      value={roleTagId}
                      onChange={(e) => setRoleTagId(e.target.value)}
                      placeholder="123456789012345678"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      onClick={() => saveSettings(server.id)}
                      disabled={updateServerMutation.isPending}
                      className="flex-1"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      {updateServerMutation.isPending ? "Сохранение..." : "Сохранить"}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={cancelEditing}
                      className="flex-1"
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">ID роли для тегирования</Label>
                    <div className="mt-1">
                      {server.roleTagId ? (
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {server.roleTagId}
                        </code>
                      ) : (
                        <span className="text-xs text-muted-foreground">Не настроено</span>
                      )}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => startEditing(server)}
                    className="w-full"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Настроить
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {!servers?.length && (
        <Card>
          <CardContent className="p-12 text-center">
            <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Нет настроенных серверов</p>
            <p className="text-sm text-muted-foreground">
              Серверы Discord создаются автоматически при запуске бота
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}