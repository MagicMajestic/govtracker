import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function AddServerPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [serverData, setServerData] = useState({
    serverId: "",
    name: "",
    roleTagId: "",
    isActive: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serverData.serverId || !serverData.name) {
      toast({
        title: "Ошибка",
        description: "ID сервера и название обязательны",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/servers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          serverId: serverData.serverId,
          name: serverData.name,
          roleTagId: serverData.roleTagId || null,
          isActive: serverData.isActive
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create server');
      }
      
      // Invalidate servers cache
      queryClient.invalidateQueries({ queryKey: ['/api/servers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/servers/stats'] });
      
      toast({
        title: "Успех",
        description: "Сервер успешно добавлен"
      });
      
      setLocation('/server-settings');
    } catch (error) {
      console.error('Error adding server:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить сервер",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Добавить новый сервер</h1>
        <p className="text-gray-400 mt-2">Добавьте новый Discord сервер для мониторинга</p>
      </div>

      <Card className="bg-[#1a1a1a] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Информация о сервере</CardTitle>
          <CardDescription className="text-gray-400">
            Введите данные нового Discord сервера
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-white">ID Discord сервера *</Label>
              <Input
                value={serverData.serverId}
                onChange={(e) => setServerData({ ...serverData, serverId: e.target.value })}
                className="bg-[#2a2a2a] border-gray-600 text-white mt-2"
                placeholder="123456789012345678"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                ID Discord сервера (правый клик на сервер → Копировать ID)
              </p>
            </div>

            <div>
              <Label className="text-white">Название сервера *</Label>
              <Input
                value={serverData.name}
                onChange={(e) => setServerData({ ...serverData, name: e.target.value })}
                className="bg-[#2a2a2a] border-gray-600 text-white mt-2"
                placeholder="Название сервера"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Понятное название для идентификации сервера
              </p>
            </div>

            <div>
              <Label className="text-white">ID роли для тегов (опционально)</Label>
              <Input
                value={serverData.roleTagId}
                onChange={(e) => setServerData({ ...serverData, roleTagId: e.target.value })}
                className="bg-[#2a2a2a] border-gray-600 text-white mt-2"
                placeholder="987654321098765432"
              />
              <p className="text-xs text-gray-400 mt-1">
                ID роли для отслеживания упоминаний (если есть)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={serverData.isActive}
                onCheckedChange={(checked) => setServerData({ ...serverData, isActive: checked })}
              />
              <Label className="text-white">Активный сервер</Label>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? "Добавление..." : "Добавить сервер"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation('/server-settings')}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Отмена
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}