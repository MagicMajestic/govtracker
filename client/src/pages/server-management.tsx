import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Server, Plus, Edit, Trash2, CheckCircle, XCircle, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface DiscordServer {
  id: number;
  serverId: string;
  name: string;
  roleTagId: string;
  isActive: boolean;
}

interface ServerStats {
  id: number;
  serverId: string;
  name: string;
  roleTagId: string;
  isActive: boolean;
  totalActivities: number;
  todayActivities: number;
  avgResponseTime: number | null;
  connected: boolean;
}

export default function ServerManagement() {
  const [editingServer, setEditingServer] = useState<DiscordServer | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    serverId: "",
    name: "",
    roleTagId: "",
    isActive: true,
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch servers
  const { data: servers = [], isLoading: serversLoading } = useQuery<DiscordServer[]>({
    queryKey: ['/api/servers'],
    refetchInterval: 10000,
  });

  // Fetch server stats
  const { data: serverStats = [], isLoading: statsLoading } = useQuery<ServerStats[]>({
    queryKey: ['/api/servers/stats'],
    refetchInterval: 10000,
  });

  const resetForm = () => {
    setFormData({
      serverId: "",
      name: "",
      roleTagId: "",
      isActive: true,
    });
    setEditingServer(null);
  };

  const handleEdit = (server: DiscordServer) => {
    setEditingServer(server);
    setFormData({
      serverId: server.serverId,
      name: server.name,
      roleTagId: server.roleTagId,
      isActive: server.isActive,
    });
    setShowAddDialog(true);
  };

  const handleSave = async () => {
    try {
      const method = editingServer ? 'PUT' : 'POST';
      const url = editingServer ? `/api/servers/${editingServer.id}` : '/api/servers';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: editingServer ? "Сервер обновлен" : "Сервер добавлен",
        });
        
        queryClient.invalidateQueries({ queryKey: ['/api/servers'] });
        queryClient.invalidateQueries({ queryKey: ['/api/servers/stats'] });
        
        setShowAddDialog(false);
        resetForm();
      } else {
        throw new Error('Ошибка сохранения сервера');
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить сервер",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (serverId: number) => {
    try {
      const response = await fetch(`/api/servers/${serverId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Сервер удален",
        });
        
        queryClient.invalidateQueries({ queryKey: ['/api/servers'] });
        queryClient.invalidateQueries({ queryKey: ['/api/servers/stats'] });
      } else {
        throw new Error('Ошибка удаления сервера');
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить сервер",
        variant: "destructive",
      });
    }
  };

  const getServerStats = (serverId: string): ServerStats | undefined => {
    return serverStats.find((stat: ServerStats) => stat.serverId === serverId);
  };

  const formatResponseTime = (seconds: number | null): string => {
    if (!seconds || isNaN(seconds)) return 'Нет данных';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return minutes > 0 ? `${minutes}м ${remainingSeconds}с` : `${remainingSeconds}с`;
  };

  if (serversLoading || statsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Управление серверами Discord</h1>
          <p className="text-gray-400 mt-2">
            Настройка серверов для мониторинга активности кураторов
          </p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Добавить сервер
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1a1a] border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingServer ? "Редактировать сервер" : "Добавить новый сервер"}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Настройте параметры Discord сервера для мониторинга
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="serverId" className="text-white">ID Discord сервера</Label>
                <Input
                  id="serverId"
                  value={formData.serverId}
                  onChange={(e) => setFormData({ ...formData, serverId: e.target.value })}
                  className="bg-[#2a2a2a] border-gray-600 text-white mt-1"
                  placeholder="728355725121945731"
                />
              </div>
              
              <div>
                <Label htmlFor="name" className="text-white">Название сервера</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-[#2a2a2a] border-gray-600 text-white mt-1"
                  placeholder="LSPD"
                />
              </div>
              
              <div>
                <Label htmlFor="roleTagId" className="text-white">ID роли для тега</Label>
                <Input
                  id="roleTagId"
                  value={formData.roleTagId}
                  onChange={(e) => setFormData({ ...formData, roleTagId: e.target.value })}
                  className="bg-[#2a2a2a] border-gray-600 text-white mt-1"
                  placeholder="1329212725921976322"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isActive" className="text-white">Активный мониторинг</Label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Отмена
              </Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                {editingServer ? "Сохранить" : "Добавить"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1a1a] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Server className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-400">Всего серверов</p>
                <p className="text-2xl font-bold text-white">{servers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1a1a1a] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-400">Подключено</p>
                <p className="text-2xl font-bold text-white">
                  {serverStats.filter(s => s.connected).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1a1a1a] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-400">Активность сегодня</p>
                <p className="text-2xl font-bold text-white">
                  {serverStats.reduce((sum, s) => sum + s.todayActivities, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1a1a1a] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-400">Не подключено</p>
                <p className="text-2xl font-bold text-white">
                  {serverStats.filter(s => !s.connected).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Servers Grid */}
      <Card className="bg-[#1a1a1a] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-500" />
            Discord серверы
          </CardTitle>
          <CardDescription className="text-gray-400">
            Список всех настроенных серверов для мониторинга
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {servers.map((server) => {
              const stats = getServerStats(server.serverId);
              return (
                <Card key={server.id} className="bg-[#232323] border-gray-600 hover:border-gray-500 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-lg">{server.name}</CardTitle>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(server)}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-[#1a1a1a] border-gray-700">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">
                                Удалить сервер
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-400">
                                Вы уверены, что хотите удалить сервер "{server.name}"? 
                                Это действие нельзя отменить.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">
                                Отмена
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(server.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Удалить
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge 
                        className={
                          stats?.connected 
                            ? "bg-green-900 text-green-300 border-green-700" 
                            : "bg-red-900 text-red-300 border-red-700"
                        }
                      >
                        {stats?.connected ? "Подключен" : "Отключен"}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="text-xs text-gray-500 font-mono break-all">
                        ID: {server.serverId}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-2 bg-[#2a2a2a] rounded">
                          <div className="text-xl font-bold text-blue-400">{stats?.messages || 0}</div>
                          <div className="text-xs text-gray-400">Сообщений</div>
                        </div>
                        <div className="text-center p-2 bg-[#2a2a2a] rounded">
                          <div className="text-xl font-bold text-green-400">{stats?.reactions || 0}</div>
                          <div className="text-xs text-gray-400">Реакций</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-2 bg-[#2a2a2a] rounded">
                          <div className="text-xl font-bold text-purple-400">{stats?.replies || 0}</div>
                          <div className="text-xs text-gray-400">Ответов</div>
                        </div>
                        <div className="text-center p-2 bg-[#2a2a2a] rounded">
                          <div className="text-xl font-bold text-orange-400">{stats?.todayActivities || 0}</div>
                          <div className="text-xs text-gray-400">Сегодня</div>
                        </div>
                      </div>
                      
                      <div className="text-center p-2 bg-[#2a2a2a] rounded">
                        <div className="text-sm font-semibold text-yellow-400">
                          {formatResponseTime(stats?.avgResponseTime || null)}
                        </div>
                        <div className="text-xs text-gray-400">Среднее время ответа</div>
                      </div>
                      
                      {stats?.topCurators && stats.topCurators.length > 0 && (
                        <div className="pt-2 border-t border-gray-600">
                          <div className="text-xs text-gray-400 mb-2">Топ кураторы:</div>
                          <div className="space-y-1">
                            {stats.topCurators.slice(0, 2).map((curator: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-xs">
                                <span className="text-gray-300">{curator.name}</span>
                                <span className="text-blue-400">{curator.activities}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {servers.length === 0 && (
            <div className="text-center py-8">
              <Server className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Серверы не настроены</p>
              <p className="text-gray-500 text-sm">Добавьте первый Discord сервер для мониторинга</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}