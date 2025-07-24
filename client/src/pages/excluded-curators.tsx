import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, UserX, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ExcludedCurator {
  id: number;
  discordId: string;
  name: string;
  reason?: string;
  excludedAt: string;
}

export default function ExcludedCurators() {
  const [newCurator, setNewCurator] = useState({
    discordId: '',
    name: '',
    reason: ''
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Получаем список исключенных кураторов
  const { data: excludedCurators = [], isLoading } = useQuery<ExcludedCurator[]>({
    queryKey: ['/api/excluded-curators'],
    staleTime: 30000,
    refetchInterval: 30000
  });

  // Мутация для добавления исключенного куратора
  const addMutation = useMutation({
    mutationFn: async (data: { discordId: string; name: string; reason?: string }) => {
      const response = await fetch('/api/excluded-curators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to add excluded curator');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/excluded-curators'] });
      setNewCurator({ discordId: '', name: '', reason: '' });
      toast({
        title: "Куратор исключен",
        description: "Куратор успешно добавлен в черный список"
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось исключить куратора",
        variant: "destructive"
      });
    }
  });

  // Мутация для удаления из исключенных
  const removeMutation = useMutation({
    mutationFn: async (discordId: string) => {
      const response = await fetch(`/api/excluded-curators/${discordId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to remove excluded curator');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/excluded-curators'] });
      toast({
        title: "Куратор восстановлен",
        description: "Куратор удален из черного списка"
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось восстановить куратора",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCurator.discordId.trim() || !newCurator.name.trim()) {
      toast({
        title: "Ошибка валидации",
        description: "Discord ID и имя куратора обязательны",
        variant: "destructive"
      });
      return;
    }
    addMutation.mutate(newCurator);
  };

  const handleRemove = (discordId: string) => {
    removeMutation.mutate(discordId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <UserX className="h-8 w-8 text-red-500" />
        <div>
          <h1 className="text-3xl font-bold">Исключенные кураторы</h1>
          <p className="text-muted-foreground">
            Управление черным списком кураторов для предотвращения импорта уволенных сотрудников
          </p>
        </div>
      </div>

      {/* Форма добавления исключенного куратора */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Добавить в черный список</span>
          </CardTitle>
          <CardDescription>
            Добавьте куратора в черный список, чтобы предотвратить его восстановление при импорте данных
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discordId">Discord ID *</Label>
                <Input
                  id="discordId"
                  value={newCurator.discordId}
                  onChange={(e) => setNewCurator({ ...newCurator, discordId: e.target.value })}
                  placeholder="123456789012345678"
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Имя куратора *</Label>
                <Input
                  id="name"
                  value={newCurator.name}
                  onChange={(e) => setNewCurator({ ...newCurator, name: e.target.value })}
                  placeholder="Имя куратора"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="reason">Причина исключения</Label>
              <Textarea
                id="reason"
                value={newCurator.reason}
                onChange={(e) => setNewCurator({ ...newCurator, reason: e.target.value })}
                placeholder="Причина увольнения или исключения..."
                rows={3}
              />
            </div>
            <Button 
              type="submit" 
              disabled={addMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {addMutation.isPending ? 'Добавление...' : 'Исключить куратора'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Список исключенных кураторов */}
      <Card>
        <CardHeader>
          <CardTitle>
            Черный список ({excludedCurators.length})
          </CardTitle>
          <CardDescription>
            Кураторы в этом списке не будут восстановлены при импорте данных
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Загрузка...</p>
            </div>
          ) : excludedCurators.length === 0 ? (
            <div className="text-center py-8">
              <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Черный список пуст</p>
              <p className="text-sm text-muted-foreground">
                Добавьте кураторов, которых не следует восстанавливать при импорте
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Куратор</TableHead>
                  <TableHead>Discord ID</TableHead>
                  <TableHead>Причина</TableHead>
                  <TableHead>Дата исключения</TableHead>
                  <TableHead className="w-[100px]">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {excludedCurators.map((curator) => (
                  <TableRow key={curator.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge variant="destructive" className="text-xs">
                          Исключен
                        </Badge>
                        <span className="font-medium">{curator.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {curator.discordId}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {curator.reason || 'Не указана'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {formatDate(curator.excludedAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(curator.discordId)}
                        disabled={removeMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Информационная карточка */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Как работает черный список</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <ul className="space-y-2 text-sm">
            <li>• Кураторы из черного списка не будут импортированы при восстановлении данных</li>
            <li>• Их исторические данные (активности, задачи) сохраняются, но связи с куратором удаляются</li>
            <li>• Это предотвращает случайное восстановление уволенных или заблокированных кураторов</li>
            <li>• Вы можете удалить куратора из черного списка для повторного включения в импорт</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}