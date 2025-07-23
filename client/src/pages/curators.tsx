import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, User, Filter, Calendar, BarChart3, Users, Building, Server } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Checkbox } from "@/components/ui/checkbox";

interface Curator {
  id: number;
  discordId: string;
  name: string;
  factions: string[];
  curatorType: 'government' | 'crime';
  isActive: boolean;
  createdAt: string;
}

interface DiscordServer {
  id: number;
  serverId: string;
  name: string;
  isActive: boolean;
}

interface Activity {
  id: number;
  type: string;
  timestamp: string;
  content?: string;
  channelName?: string;
}

const governmentFactions = [
  'Government', 'FIB', 'LSPD', 'SANG', 'LSCSD', 'EMS', 'Weazel News', 'Detectives'
];

const crimeFactions = [
  'Marabunta', 'Vagos', 'Ballas', 'Families', 'Bloods', 'Crips'
];

export default function Curators() {
  const [activeTab, setActiveTab] = useState("curators");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isServerDialogOpen, setIsServerDialogOpen] = useState(false);
  const [editingCurator, setEditingCurator] = useState<Curator | null>(null);
  const [selectedCurator, setSelectedCurator] = useState<Curator | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'government' | 'crime'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  const [newCurator, setNewCurator] = useState({
    discordId: "",
    name: "",
    factions: [] as string[],
    curatorType: "government" as 'government' | 'crime',
  });

  const [newServer, setNewServer] = useState({
    serverId: "",
    name: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: curators = [], isLoading } = useQuery({
    queryKey: ["/api/curators", filterType],
    queryFn: () => filterType === 'all' ? 
      fetch("/api/curators").then(r => r.json()) :
      fetch(`/api/curators?type=${filterType}`).then(r => r.json())
  });

  const { data: servers = [] } = useQuery({
    queryKey: ["/api/servers"],
  });

  const { data: curatorActivities = [] } = useQuery({
    queryKey: ["/api/curators", selectedCurator?.id, "activities", dateRange],
    queryFn: () => {
      if (!selectedCurator) return [];
      const params = new URLSearchParams();
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      return fetch(`/api/curators/${selectedCurator.id}/activities?${params}`).then(r => r.json());
    },
    enabled: !!selectedCurator
  });

  const addCuratorMutation = useMutation({
    mutationFn: async (curator: typeof newCurator) =>
      apiRequest("/api/curators", "POST", curator),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/curators"] });
      setIsAddDialogOpen(false);
      setNewCurator({ discordId: "", name: "", factions: [], curatorType: "government" });
      toast({
        title: "Куратор добавлен",
        description: "Новый куратор успешно добавлен в систему",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить куратора",
        variant: "destructive",
      });
    },
  });

  const addServerMutation = useMutation({
    mutationFn: async (server: typeof newServer) =>
      apiRequest("/api/servers", "POST", server),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/servers"] });
      setIsServerDialogOpen(false);
      setNewServer({ serverId: "", name: "" });
      toast({
        title: "Сервер добавлен",
        description: "Новый Discord сервер добавлен для мониторинга",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить сервер",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Curator) =>
      apiRequest(`/api/curators/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/curators"] });
      setEditingCurator(null);
      toast({
        title: "Куратор обновлен",
        description: "Данные куратора успешно обновлены",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest(`/api/curators/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/curators"] });
      toast({
        title: "Куратор удален",
        description: "Куратор успешно удален из системы",
      });
    },
  });

  const handleSubmitCurator = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCurator) {
      updateMutation.mutate({
        ...editingCurator,
        ...newCurator,
      });
    } else {
      addCuratorMutation.mutate(newCurator);
    }
  };

  const handleSubmitServer = (e: React.FormEvent) => {
    e.preventDefault();
    addServerMutation.mutate(newServer);
  };

  const handleEdit = (curator: Curator) => {
    setEditingCurator(curator);
    setNewCurator({
      discordId: curator.discordId,
      name: curator.name,
      factions: curator.factions,
      curatorType: curator.curatorType,
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Вы уверены, что хотите удалить этого куратора?")) {
      deleteMutation.mutate(id);
    }
  };

  const toggleFaction = (faction: string) => {
    setNewCurator(prev => ({
      ...prev,
      factions: prev.factions.includes(faction)
        ? prev.factions.filter(f => f !== faction)
        : [...prev.factions, faction]
    }));
  };

  const getActivityStats = (activities: Activity[]) => {
    const stats = {
      messages: activities.filter(a => a.type === 'message').length,
      reactions: activities.filter(a => a.type === 'reaction').length,
      replies: activities.filter(a => a.type === 'reply').length,
    };
    return stats;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Загрузка данных...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Управление системой</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="curators" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Кураторы
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Детали
          </TabsTrigger>
          <TabsTrigger value="servers" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Серверы
          </TabsTrigger>
        </TabsList>

        <TabsContent value="curators" className="space-y-6">
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={filterType} onValueChange={(value: 'all' | 'government' | 'crime') => setFilterType(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Фильтр по типу" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все кураторы</SelectItem>
                  <SelectItem value="government">Государственные</SelectItem>
                  <SelectItem value="crime">Криминальные</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingCurator(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить куратора
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingCurator ? "Редактировать куратора" : "Добавить куратора"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitCurator} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="discordId">Discord ID</Label>
                      <Input
                        id="discordId"
                        value={newCurator.discordId}
                        onChange={(e) =>
                          setNewCurator({ ...newCurator, discordId: e.target.value })
                        }
                        placeholder="123456789012345678"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">Имя</Label>
                      <Input
                        id="name"
                        value={newCurator.name}
                        onChange={(e) =>
                          setNewCurator({ ...newCurator, name: e.target.value })
                        }
                        placeholder="Имя куратора"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Тип куратора</Label>
                    <Select value={newCurator.curatorType} onValueChange={(value: 'government' | 'crime') => setNewCurator({ ...newCurator, curatorType: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="government">Государственный</SelectItem>
                        <SelectItem value="crime">Криминальный</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Фракции ({newCurator.factions.length} выбрано)</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto">
                      {(newCurator.curatorType === 'government' ? governmentFactions : crimeFactions).map((faction) => (
                        <div key={faction} className="flex items-center space-x-2">
                          <Checkbox
                            id={faction}
                            checked={newCurator.factions.includes(faction)}
                            onCheckedChange={() => toggleFaction(faction)}
                          />
                          <Label htmlFor={faction} className="text-sm">{faction}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={addCuratorMutation.isPending || updateMutation.isPending}
                    className="w-full"
                  >
                    {editingCurator ? "Обновить" : "Добавить"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {curators.map((curator: Curator) => (
              <Card key={curator.id} className="bg-card hover:bg-accent/5 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    {curator.name}
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCurator(curator)}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(curator)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(curator.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">
                      Discord ID: {curator.discordId}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={curator.curatorType === 'government' ? 'default' : 'secondary'} className="text-xs">
                        {curator.curatorType === 'government' ? 'Гос.' : 'Крайм'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {curator.factions.slice(0, 3).map(faction => (
                        <Badge key={faction} variant="outline" className="text-xs">{faction}</Badge>
                      ))}
                      {curator.factions.length > 3 && (
                        <Badge variant="outline" className="text-xs">+{curator.factions.length - 3}</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          {selectedCurator ? (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Детали куратора: {selectedCurator.name}</h2>
                <Button variant="outline" onClick={() => setSelectedCurator(null)}>
                  Закрыть
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <Label htmlFor="startDate">Дата начала</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Дата окончания</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                {(() => {
                  const stats = getActivityStats(curatorActivities);
                  return (
                    <>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Сообщения</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{stats.messages}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Реакции</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{stats.reactions}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Ответы</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{stats.replies}</div>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>История активности</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {curatorActivities.map((activity: Activity) => (
                      <div key={activity.id} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <Badge variant="outline">{activity.type}</Badge>
                          {activity.channelName && (
                            <span className="ml-2 text-sm text-muted-foreground">#{activity.channelName}</span>
                          )}
                          {activity.content && (
                            <p className="text-sm mt-1">{activity.content.substring(0, 100)}...</p>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Выберите куратора</h3>
                <p className="text-muted-foreground text-center">
                  Нажмите на иконку статистики рядом с куратором для просмотра детальной информации
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="servers" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Discord серверы</h2>
            <Dialog open={isServerDialogOpen} onOpenChange={setIsServerDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить сервер
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Добавить Discord сервер</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitServer} className="space-y-4">
                  <div>
                    <Label htmlFor="serverId">ID сервера</Label>
                    <Input
                      id="serverId"
                      value={newServer.serverId}
                      onChange={(e) => setNewServer({ ...newServer, serverId: e.target.value })}
                      placeholder="123456789012345678"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="serverName">Название сервера</Label>
                    <Input
                      id="serverName"
                      value={newServer.name}
                      onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                      placeholder="Название фракции"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={addServerMutation.isPending} className="w-full">
                    Добавить сервер
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {servers.map((server: DiscordServer) => (
              <Card key={server.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Building className="mr-2 h-4 w-4" />
                    {server.name}
                  </CardTitle>
                  <Badge variant={server.isActive ? 'default' : 'secondary'}>
                    {server.isActive ? 'Активен' : 'Неактивен'}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">
                    ID: {server.serverId}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}