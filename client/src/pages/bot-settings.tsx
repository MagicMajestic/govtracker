import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Bot, Shield, Activity, Clock, MessageSquare, Target, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatTimeRussian } from "@/lib/timeFormat";

interface RatingSettings {
  id: number;
  ratingName: string;
  ratingText: string;
  minScore: number;
  color: string;
}

interface GlobalRatingConfig {
  id: number;
  activityPointsMessage: number;
  activityPointsReaction: number;
  activityPointsReply: number;
  activityPointsTaskVerification: number;
  responseTimeGoodSeconds: number;
  responseTimePoorSeconds: number;
}

interface NotificationSettings {
  id: number;
  notificationServerId: string;
  notificationChannelId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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

  const [ratingSettings, setRatingSettings] = useState<RatingSettings[]>([]);
  const [globalConfig, setGlobalConfig] = useState<GlobalRatingConfig>({
    id: 1,
    activityPointsMessage: 3,
    activityPointsReaction: 1,
    activityPointsReply: 2,
    activityPointsTaskVerification: 5,
    responseTimeGoodSeconds: 60,
    responseTimePoorSeconds: 300,
  });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [botResponse, ratingResponse, globalResponse, notificationResponse] = await Promise.all([
          fetch('/api/bot-settings'),
          fetch('/api/rating-settings'),
          fetch('/api/global-rating-config'),
          fetch('/api/notification-settings')
        ]);
        
        const settings = await botResponse.json();
        const ratings = await ratingResponse.json();
        const global = await globalResponse.json();
        const notifications = await notificationResponse.json();
        
        // Update state with loaded settings, keep defaults for missing keys
        setBotConfig(prev => ({
          ...prev,
          ...settings
        }));
        
        setRatingSettings(ratings);
        if (global) {
          setGlobalConfig(global);
        }
        setNotificationSettings(notifications);
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

  const handleSaveRatings = async () => {
    setSaving(true);
    try {
      const [ratingResponse, globalResponse] = await Promise.all([
        fetch('/api/rating-settings', {
          method: 'POST',
          body: JSON.stringify(ratingSettings),
          headers: {
            'Content-Type': 'application/json',
          },
        }),
        fetch('/api/global-rating-config', {
          method: 'POST',
          body: JSON.stringify(globalConfig),
          headers: {
            'Content-Type': 'application/json',
          },
        })
      ]);

      const ratingResult = await ratingResponse.json();
      const globalResult = await globalResponse.json();
      
      if (ratingResult.success || globalResult) {
        toast({
          title: "Сохранено",
          description: "Настройки оценки производительности обновлены",
        });
      }
    } catch (error) {
      console.error('Error saving rating settings:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки оценки",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateRatingSettings = (index: number, field: keyof RatingSettings, value: any) => {
    const updated = [...ratingSettings];
    updated[index] = { ...updated[index], [field]: value };
    setRatingSettings(updated);
  };

  const saveNotificationSettings = async (serverId: string, channelId: string) => {
    setSaving(true);
    try {
      const method = notificationSettings ? 'PUT' : 'POST';
      const response = await fetch('/api/notification-settings', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationServerId: serverId,
          notificationChannelId: channelId,
        }),
      });

      const result = await response.json();
      setNotificationSettings(result);
      
      toast({
        title: "Сохранено",
        description: "Настройки каналов уведомлений обновлены",
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки каналов",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateGlobalConfig = (field: keyof GlobalRatingConfig, value: any) => {
    if (field === 'id') return; // Don't allow changing ID
    setGlobalConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#121212]">
      <div className="max-w-6xl mx-auto space-y-6">
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

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-[#1a1a1a] border-gray-700">
            <TabsTrigger value="basic" className="text-white data-[state=active]:bg-blue-600">
              Основные настройки
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-white data-[state=active]:bg-blue-600">
              Каналы уведомлений
            </TabsTrigger>
            <TabsTrigger value="performance" className="text-white data-[state=active]:bg-blue-600">
              Оценка производительности
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
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
                    @LSPD https://discord.com/channels/123.../456... без ответа уже {Math.floor(parseInt(botConfig.notificationDelay) / 60)} мин.
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
                {saving ? "Сохранение..." : "Сохранить основные настройки"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-[#1a1a1a] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                  Настройка каналов уведомлений
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Выберите Discord сервер и канал для отправки уведомлений кураторам
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="notification-server" className="text-white">
                      ID Discord сервера
                    </Label>
                    <Input
                      id="notification-server"
                      value={notificationSettings?.notificationServerId || "805026457327108126"}
                      onChange={(e) => {
                        const serverId = e.target.value;
                        setNotificationSettings(prev => prev ? 
                          { ...prev, notificationServerId: serverId } : 
                          { 
                            id: 0, 
                            notificationServerId: serverId, 
                            notificationChannelId: "974783377465036861", 
                            isActive: true, 
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                          }
                        );
                      }}
                      className="bg-[#2a2a2a] border-gray-600 text-white mt-1"
                      placeholder="Введите ID сервера Discord"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Сервер, куда будут отправляться уведомления
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="notification-channel" className="text-white">
                      ID канала уведомлений
                    </Label>
                    <Input
                      id="notification-channel"
                      value={notificationSettings?.notificationChannelId || "974783377465036861"}
                      onChange={(e) => {
                        const channelId = e.target.value;
                        setNotificationSettings(prev => prev ? 
                          { ...prev, notificationChannelId: channelId } : 
                          { 
                            id: 0, 
                            notificationServerId: "805026457327108126", 
                            notificationChannelId: channelId, 
                            isActive: true, 
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                          }
                        );
                      }}
                      className="bg-[#2a2a2a] border-gray-600 text-white mt-1"
                      placeholder="Введите ID канала"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Конкретный канал в сервере для уведомлений
                    </p>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-blue-400" />
                    <span className="text-blue-400 font-medium">Предварительный просмотр</span>
                  </div>
                  <div className="bg-[#0a0a0a] rounded p-3 font-mono text-sm text-gray-300">
                    @here https://discord.com/channels/SERVER_ID/CHANNEL_ID/MESSAGE_ID без ответа уже 5 мин.
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Сервер: {notificationSettings?.notificationServerId || "не установлен"}<br />
                    Канал: {notificationSettings?.notificationChannelId || "не установлен"}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={() => saveNotificationSettings(
                      notificationSettings?.notificationServerId || "805026457327108126",
                      notificationSettings?.notificationChannelId || "974783377465036861"
                    )}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {saving ? "Сохранение..." : "Сохранить настройки"}
                  </Button>
                  
                  {notificationSettings && (
                    <Badge variant="outline" className="text-green-400 border-green-400 h-10 px-3 flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                      Настроено
                    </Badge>
                  )}
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-yellow-400" />
                    <span className="text-yellow-400 font-medium">Как получить ID</span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p>1. Включите режим разработчика в Discord: Настройки → Продвинутые → Режим разработчика</p>
                    <p>2. Для ID сервера: Правый клик на сервер → Копировать ID</p>
                    <p>3. Для ID канала: Правый клик на канал → Копировать ID</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid gap-6">
              {/* Global Configuration */}
              <Card className="bg-[#1a1a1a] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    Глобальные настройки оценки
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Настройки, применимые ко всем категориям рейтинга
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-[#2a2a2a] p-4 rounded-md border border-gray-600">
                    <h4 className="font-semibold text-white mb-2">Система оценки:</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• <strong>Баллы за активность:</strong> Одинаковые для всех категорий рейтинга</li>
                      <li>• <strong>Время ответа:</strong> Глобальные пороги для всех кураторов</li>
                      <li>• <strong>Пороги рейтингов:</strong> Только минимальные баллы различаются между категориями</li>
                    </ul>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Activity Points */}
                    <div>
                      <Label className="text-white text-sm">Баллы за сообщение</Label>
                      <Input
                        type="number"
                        value={globalConfig.activityPointsMessage}
                        onChange={(e) => updateGlobalConfig('activityPointsMessage', parseInt(e.target.value) || 0)}
                        className="bg-[#1a1a1a] border-gray-600 text-white mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-white text-sm">Баллы за реакцию</Label>
                      <Input
                        type="number"
                        value={globalConfig.activityPointsReaction}
                        onChange={(e) => updateGlobalConfig('activityPointsReaction', parseInt(e.target.value) || 0)}
                        className="bg-[#1a1a1a] border-gray-600 text-white mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-white text-sm">Баллы за ответ</Label>
                      <Input
                        type="number"
                        value={globalConfig.activityPointsReply}
                        onChange={(e) => updateGlobalConfig('activityPointsReply', parseInt(e.target.value) || 0)}
                        className="bg-[#1a1a1a] border-gray-600 text-white mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-white text-sm">Баллы за проверку задач</Label>
                      <Input
                        type="number"
                        value={globalConfig.activityPointsTaskVerification}
                        onChange={(e) => updateGlobalConfig('activityPointsTaskVerification', parseInt(e.target.value) || 0)}
                        className="bg-[#1a1a1a] border-gray-600 text-white mt-1"
                      />
                      <p className="text-xs text-gray-400 mt-1">Баллы за верификацию задач в каналах completed-tasks</p>
                    </div>

                    {/* Response Time Thresholds */}
                    <div>
                      <Label className="text-white text-sm">Хорошее время ответа (сек)</Label>
                      <Input
                        type="number"
                        value={globalConfig.responseTimeGoodSeconds}
                        onChange={(e) => updateGlobalConfig('responseTimeGoodSeconds', parseInt(e.target.value) || 0)}
                        className="bg-[#1a1a1a] border-gray-600 text-white mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-white text-sm">Плохое время ответа (сек)</Label>
                      <Input
                        type="number"
                        value={globalConfig.responseTimePoorSeconds}
                        onChange={(e) => updateGlobalConfig('responseTimePoorSeconds', parseInt(e.target.value) || 0)}
                        className="bg-[#1a1a1a] border-gray-600 text-white mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rating Thresholds */}
              <Card className="bg-[#1a1a1a] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-400" />
                    Пороги рейтингов
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Минимальные баллы для каждого уровня рейтинга
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ratingSettings
                    .sort((a, b) => b.minScore - a.minScore)
                    .map((rating, index) => (
                      <div key={rating.id} className="flex items-center gap-4 p-4 bg-[#2a2a2a] rounded border border-gray-600">
                        <div className={`w-4 h-4 rounded ${rating.color}`} />
                        <div className="flex-1">
                          <span className="text-white font-medium">{rating.ratingText}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-white text-sm">Минимальные баллы:</Label>
                          <Input
                            type="number"
                            value={rating.minScore}
                            onChange={(e) => updateRatingSettings(index, 'minScore', parseInt(e.target.value) || 0)}
                            className="bg-[#1a1a1a] border-gray-600 text-white w-20"
                          />
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>

              {/* Performance Preview */}
              <Card className="bg-[#1a1a1a] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-400" />
                    Предварительный просмотр системы оценки
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-[#2a2a2a] p-4 rounded border border-gray-600">
                      <h4 className="font-semibold text-white mb-2">Глобальные настройки:</h4>
                      <div className="text-sm text-gray-300 space-y-1">
                        <div>• Сообщение: <strong>{globalConfig.activityPointsMessage} баллов</strong></div>
                        <div>• Реакция: <strong>{globalConfig.activityPointsReaction} балл</strong></div>
                        <div>• Ответ: <strong>{globalConfig.activityPointsReply} балла</strong></div>
                        <div>• Хорошее время ответа: <strong>{formatTimeRussian(globalConfig.responseTimeGoodSeconds)}</strong></div>
                        <div>• Плохое время ответа: <strong>{formatTimeRussian(globalConfig.responseTimePoorSeconds)}</strong></div>
                      </div>
                    </div>
                    
                    <div className="grid gap-3">
                      <h4 className="font-semibold text-white">Пороги рейтингов:</h4>
                      {ratingSettings
                        .sort((a, b) => b.minScore - a.minScore)
                        .map((rating) => (
                          <div key={rating.id} className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded border border-gray-600">
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded ${rating.color}`} />
                              <span className="text-white font-medium">{rating.ratingText}</span>
                            </div>
                            <div className="text-gray-400 text-sm">
                              {rating.minScore}+ баллов
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleSaveRatings}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={saving || loading}
              >
                {saving ? "Сохранение..." : "Сохранить настройки оценки"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}