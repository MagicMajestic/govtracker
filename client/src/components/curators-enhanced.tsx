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
import { getRatingText, getRatingColor, getActivityStatusText, getActivityStatusColor } from "@/lib/rating";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { InsertCurator } from "@shared/schema";

interface Curator {
  id: number;
  name: string;
  factions: string[];
  curatorType: string;
  subdivision?: string; // 'government', 'crimea' для государственных
  discordId: string;
  isActive: boolean;
}

interface CuratorWithStats extends Curator {
  totalActivities: number;
  score: number;
  avgResponseTime?: number;
  activityStatus: "excellent" | "good" | "normal" | "poor";
}

const factions = [
  { value: "government", label: "Government" },
  { value: "fib", label: "FIB" },
  { value: "lspd", label: "LSPD" },
  { value: "sang", label: "SANG" },
  { value: "lscsd", label: "LSCSD" },
  { value: "ems", label: "EMS" },
  { value: "weazel", label: "Weazel News" },
  { value: "detectives", label: "Detectives" },
];

export function CuratorsEnhanced() {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [editingCurator, setEditingCurator] = useState<Curator | null>(null);
  const [formData, setFormData] = useState<{
    discordId: string;
    name: string;
    factions: string[];
    curatorType: "government" | "crime";
    subdivision?: "government" | "crimea";
  }>({
    discordId: "",
    name: "",
    factions: [],
    curatorType: "government",
    subdivision: "government"
  });

  const { data: curators, isLoading } = useQuery<Curator[]>({
    queryKey: ["/api/curators"]
  });

  const { data: topCurators } = useQuery<CuratorWithStats[]>({
    queryKey: ["/api/top-curators"],
    queryFn: () => fetch("/api/top-curators?limit=50").then(res => res.json())
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertCurator) => {
      const response = await apiRequest("POST", "/api/curators", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/curators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/curators/top"] });
      toast({ title: "Успешно", description: "Куратор успешно добавлен." });
      setIsCreating(false);
      setFormData({ discordId: "", name: "", factions: [], curatorType: "government", subdivision: "government" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось добавить куратора.", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertCurator> }) => {
      const response = await apiRequest("PUT", `/api/curators/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/curators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/curators/top"] });
      toast({ title: "Успешно", description: "Куратор успешно обновлен." });
      setEditingCurator(null);
      setFormData({ discordId: "", name: "", factions: [], curatorType: "government", subdivision: "government" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось обновить куратора.", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/curators/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/curators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/curators/top"] });
      toast({ title: "Куратор удален", description: "Куратор был успешно удален." });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось удалить куратора.", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.discordId || !formData.name || formData.factions.length === 0) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните все поля и выберите хотя бы одну фракцию",
        variant: "destructive",
      });
      return;
    }

    if (editingCurator) {
      updateMutation.mutate({
        id: editingCurator.id,
        data: {
          discordId: formData.discordId,
          name: formData.name,
          factions: formData.factions,
          curatorType: formData.curatorType,
          subdivision: formData.subdivision
        }
      });
    } else {
      createMutation.mutate({
        discordId: formData.discordId,
        name: formData.name,
        factions: formData.factions,
        curatorType: formData.curatorType,
        subdivision: formData.subdivision
      });
    }
  };

  const startEditing = (curator: Curator) => {
    setEditingCurator(curator);
    setFormData({
      discordId: curator.discordId,
      name: curator.name,
      factions: curator.factions || [],
      curatorType: curator.curatorType as "government" | "crime",
      subdivision: curator.subdivision as "government" | "crimea" | undefined
    });
    setIsCreating(true);
  };

  const cancelEditing = () => {
    setEditingCurator(null);
    setIsCreating(false);
    setFormData({ discordId: "", name: "", factions: [], curatorType: "government", subdivision: "government" });
  };

  const addFaction = (faction: string) => {
    if (!formData.factions.includes(faction)) {
      setFormData(prev => ({
        ...prev,
        factions: [...prev.factions, faction]
      }));
    }
  };

  const removeFaction = (faction: string) => {
    setFormData(prev => ({
      ...prev,
      factions: prev.factions.filter(f => f !== faction)
    }));
  };

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
    const stats = Array.isArray(topCurators) ? topCurators.find(tc => tc.id === curator.id) : null;
    const totalActivities = stats?.totalActivities || 0;
    
    return {
      ...curator,
      totalActivities,
      score: stats?.score || 0,
      avgResponseTime: stats?.avgResponseTime,
      activityStatus: "normal" as any
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
                    {curator.curatorType === 'government' ? 'Государственный' : 
                     curator.curatorType === 'government_crimea' ? 'Государственный (Крым)' : 'Криминальный'}
                    {curator.subdivision && (
                      <span className="ml-1 text-xs">
                        ({curator.subdivision === 'government' ? 'Гос.' : 'Крым'})
                      </span>
                    )}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {curator.factions.map((faction, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {faction}
                      </Badge>
                    ))}
                  </div>

                  {/* Performance Rating */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2">
                      <div className={`h-2 w-2 rounded-full ${getRatingColor(curator.score).replace('bg-', 'bg-')}`} />
                      <span className="text-xs font-medium">
                        {getRatingText(curator.score)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      <span>{curator.score} очков • {curator.totalActivities} активностей</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Ответ: {curator.avgResponseTime ? `${curator.avgResponseTime}с` : "Н/Д"}</span>
                    </div>

                    <div className={`h-2 w-full ${getRatingColor(curator.score)} rounded-full`}>
                      <div 
                        className="h-full bg-white/30 rounded-full" 
                        style={{ width: `${Math.max(0, 100 - curator.score)}%` }}
                      />
                    </div>
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
                      onClick={() => startEditing(curator)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
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

      {/* Create Curator Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCurator ? "Редактировать куратора" : "Добавить куратора"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="discordId">Discord ID</Label>
              <Input
                id="discordId"
                type="text"
                placeholder="123456789012345678"
                value={formData.discordId}
                onChange={(e) => setFormData(prev => ({ ...prev, discordId: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="name">Имя куратора</Label>
              <Input
                id="name"
                type="text"
                placeholder="Введите имя куратора"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="curatorType">Тип куратора</Label>
              <Select 
                value={formData.curatorType} 
                onValueChange={(value: "government" | "crime") => {
                  setFormData(prev => ({ 
                    ...prev, 
                    curatorType: value,
                    subdivision: value === "government" ? "government" : undefined
                  }))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="government">Государственный</SelectItem>
                  <SelectItem value="crime">Криминальный</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Фракции</Label>
              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex flex-wrap gap-1 mb-3">
                  {formData.factions.map((faction, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {factions.find(f => f.value === faction)?.label || faction}
                      <button
                        type="button"
                        onClick={() => removeFaction(faction)}
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <Select onValueChange={addFaction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Добавить фракцию" />
                  </SelectTrigger>
                  <SelectContent>
                    {factions.filter(f => !formData.factions.includes(f.value)).map((faction) => (
                      <SelectItem key={faction.value} value={faction.value}>
                        {faction.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={cancelEditing}
                className="flex-1"
              >
                Отмена
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingCurator 
                  ? (updateMutation.isPending ? "Сохранение..." : "Сохранить")
                  : (createMutation.isPending ? "Добавление..." : "Добавить")
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}