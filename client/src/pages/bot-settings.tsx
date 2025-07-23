import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Settings, Bot, Shield, Activity, Clock, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function BotSettings() {
  const [botConfig, setBotConfig] = useState({
    monitoringEnabled: "true",
    curatorNotificationEnabled: "true", 
    notificationDelay: "300", // 5 минут по умолчанию
    keywordDetection: "true",
    logLevel: "info",
    maxResponseTime: "300",
    allowedChannels: "",
    customKeywords: "куратор, curator, помощь, help, вопрос, question",
    curatorServerId: "805026457327108126",
    curatorChannelId: "974783377465036861"
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/bot-settings');
        const settings = await response.json();
        
        // Update state with loaded settings, keep defaults for missing keys
        setBotConfig(prev => ({
          ...prev,
          ...settings
        }));
      } catch (error) {
        console.error('Error loading settings:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить настройки",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/bot-settings', {
        method: 'POST',
        body: JSON.stringify(botConfig),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Сохранено",
          description: "Настройки бота успешно обновлены",
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#121212]">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Settings className="h-8 w-8 text-blue-500" />
              Настройки бота
            </h1>
            <p className="text-gray-400 mt-2">
              Конфигурация Discord бота "Curator#2772" для мониторинга кураторов
            </p>
          </div>
          <Badge variant="outline" className="text-green-400 border-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
            Бот онлайн
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Основные настройки */}
          <Card className="bg-[#1a1a1a] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-500" />
                Основные настройки
              </CardTitle>
              <CardDescription className="text-gray-400">
                Базовая конфигурация бота
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="monitoring" className="text-white">
                  Мониторинг активности
                </Label>
                <Switch
                  id="monitoring"
                  checked={botConfig.monitoringEnabled === "true"}
                  onCheckedChange={(checked) =>
                    setBotConfig({ ...botConfig, monitoringEnabled: checked.toString() })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="keyword-detection" className="text-white">
                  Детекция ключевых слов
                </Label>
                <Switch
                  id="keyword-detection"
                  checked={botConfig.keywordDetection === "true"}
                  onCheckedChange={(checked) =>
                    setBotConfig({ ...botConfig, keywordDetection: checked.toString() })
                  }
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="curator-notification" className="text-white">
                    Уведомления кураторов
                  </Label>
                  <Switch
                    id="curator-notification"
                    checked={botConfig.curatorNotificationEnabled === "true"}
                    onCheckedChange={(checked) =>
                      setBotConfig({ ...botConfig, curatorNotificationEnabled: checked.toString() })
                    }
                  />
                </div>
                <div className="text-sm text-gray-400 bg-[#2a2a2a] p-3 rounded-md border border-gray-600">
                  <strong className="text-blue-400">Что это:</strong> Автоматические уведомления кураторам о неотвеченных сообщениях.
                  <br /><br />
                  <strong className="text-green-400">Как работает:</strong>
                  <ul className="mt-1 ml-4 list-disc space-y-1">
                    <li>Бот отслеживает сообщения с тегами кураторов или ключевыми словами</li>
                    <li>Если нет ответа в течение установленного времени - отправляет уведомление</li>
                    <li>Сообщение отправляется в Discord сервер кураторов (ID: 805026457327108126)</li>
                    <li>Формат: "@LSPD (ссылка на сообщение) без ответа уже 5 минут"</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Настройки времени ответа */}
          <Card className="bg-[#1a1a1a] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Время ответа
              </CardTitle>
              <CardDescription className="text-gray-400">
                Настройки отслеживания времени ответа
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="notification-delay" className="text-white">
                  Время до уведомления (сек)
                </Label>
                <Input
                  id="notification-delay"
                  type="number"
                  value={botConfig.notificationDelay}
                  onChange={(e) =>
                    setBotConfig({ ...botConfig, notificationDelay: e.target.value })
                  }
                  className="bg-[#2a2a2a] border-gray-600 text-white mt-1"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Через сколько секунд отправить уведомление кураторам (по умолчанию 300 сек = 5 мин)
                </p>
              </div>

              <div>
                <Label htmlFor="max-response" className="text-white">
                  Максимальное время ответа (сек)
                </Label>
                <Input
                  id="max-response"
                  type="number"
                  value={botConfig.maxResponseTime}
                  onChange={(e) =>
                    setBotConfig({ ...botConfig, maxResponseTime: e.target.value })
                  }
                  className="bg-[#2a2a2a] border-gray-600 text-white mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Настройки уведомлений */}
          {botConfig.curatorNotificationEnabled === "true" && (
            <Card className="bg-[#1a1a1a] border-gray-700 md:col-span-2 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                  Настройка уведомлений кураторов
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Параметры отправки уведомлений о неотвеченных сообщениях
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-white">ID Discord сервера кураторов:</Label>
                  <Input
                    value={botConfig.curatorServerId}
                    onChange={(e) =>
                      setBotConfig({ ...botConfig, curatorServerId: e.target.value })
                    }
                    className="bg-[#2a2a2a] border-gray-600 text-white mt-2"
                    placeholder="805026457327108126"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Discord сервер, куда будут отправляться уведомления о неотвеченных сообщениях
                  </p>
                </div>
                
                <div>
                  <Label className="text-white">ID канала для уведомлений:</Label>
                  <Input
                    value={botConfig.curatorChannelId}
                    onChange={(e) =>
                      setBotConfig({ ...botConfig, curatorChannelId: e.target.value })
                    }
                    className="bg-[#2a2a2a] border-gray-600 text-white mt-2"
                    placeholder="974783377465036861"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Конкретный канал в сервере кураторов для отправки уведомлений
                  </p>
                </div>
                <div className="bg-[#2a2a2a] p-3 rounded-md border border-gray-600">
                  <Label className="text-white text-sm">Пример уведомления:</Label>
                  <div className="mt-2 p-2 bg-[#1a1a1a] rounded text-sm text-gray-300 font-mono">
                    @LSPD https://discord.com/channels/123.../456... без ответа уже {Math.floor(botConfig.notificationDelay / 60)} мин.
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Сервер: {botConfig.curatorServerId}<br/>
                    Канал: {botConfig.curatorChannelId}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ключевые слова */}
          <Card className="bg-[#1a1a1a] border-gray-700 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                Ключевые слова для отслеживания
              </CardTitle>
              <CardDescription className="text-gray-400">
                Слова и фразы, которые запускают отслеживание времени ответа
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={botConfig.customKeywords}
                onChange={(e) =>
                  setBotConfig({ ...botConfig, customKeywords: e.target.value })
                }
                placeholder="Введите ключевые слова через запятую..."
                className="bg-[#2a2a2a] border-gray-600 text-white min-h-[100px]"
              />
              <p className="text-sm text-gray-400 mt-2">
                Разделяйте ключевые слова запятыми. Поиск не чувствителен к регистру.
              </p>
            </CardContent>
          </Card>

          {/* Статистика бота */}
          <Card className="bg-[#1a1a1a] border-gray-700 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                Статистика бота
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">8</div>
                  <div className="text-sm text-gray-400">Серверов</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">1</div>
                  <div className="text-sm text-gray-400">Подключено</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">0</div>
                  <div className="text-sm text-gray-400">Кураторов</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">0</div>
                  <div className="text-sm text-gray-400">Активности</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={saving || loading}
          >
            {saving ? "Сохранение..." : "Сохранить настройки"}
          </Button>
        </div>
      </div>
    </div>
  );
}