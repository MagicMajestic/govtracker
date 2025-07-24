import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Heart, Reply, Search, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

export default function Activity() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedServer, setSelectedServer] = useState("");

  const { data: activities, isLoading } = useQuery({
    queryKey: ["/api/activities/recent"],
  });

  const { data: servers } = useQuery({
    queryKey: ["/api/servers"],
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "message": return MessageSquare;
      case "reaction": return Heart;
      case "reply": return Reply;
      default: return MessageSquare;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "message": return "bg-blue-500";
      case "reaction": return "bg-red-500";
      case "reply": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getActivityTypeText = (type: string) => {
    switch (type) {
      case "message": return "Сообщение";
      case "reaction": return "Реакция";
      case "reply": return "Ответ";
      default: return "Действие";
    }
  };

  const getActivityDescription = (activity: any) => {
    switch (activity.type) {
      case "message":
        return `Сообщение в канале #${activity.channelName || 'канал'}`;
      case "reaction":
        return `Реакция ${activity.reactionEmoji} на сообщение в #${activity.channelName || 'канал'}`;
      case "reply":
        return `Ответ на сообщение в #${activity.channelName || 'канал'}`;
      default:
        return "Действие в Discord";
    }
  };

  const filteredActivities = (activities || []).filter((activity: any) => {
    const matchesSearch = !searchTerm || 
      activity.curator?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || selectedType === "all" || activity.type === selectedType;
    const matchesServer = !selectedServer || selectedServer === "all" || activity.server?.name === selectedServer;
    return matchesSearch && matchesType && matchesServer;
  }) || [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="surface border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">История активности</h2>
            <p className="text-sm text-gray-400">
              Детальная история всех действий кураторов
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Calendar className="h-4 w-4" />
            <span>Последние 200 записей</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 scrollbar-thin">
        <Card className="surface border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Фильтры</CardTitle>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Поиск по куратору или содержимому..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-600 text-white"
                />
              </div>
              
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Все типы активности" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all" className="text-white">Все типы</SelectItem>
                  <SelectItem value="message" className="text-white">Сообщения</SelectItem>
                  <SelectItem value="reaction" className="text-white">Реакции</SelectItem>
                  <SelectItem value="reply" className="text-white">Ответы</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedServer} onValueChange={setSelectedServer}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Все серверы" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all" className="text-white">Все серверы</SelectItem>
                  {(servers || []).map((server: any) => (
                    <SelectItem key={server.id} value={server.name} className="text-white">
                      {server.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-400">Загрузка активности...</p>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">Активность не найдена</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredActivities.map((activity: any) => {
                  const Icon = getActivityIcon(activity.type);
                  const iconColor = getActivityColor(activity.type);
                  
                  return (
                    <div key={activity.id} className="border border-gray-700 rounded-lg p-4 hover:bg-gray-800/30 transition-colors">
                      <div className="flex items-start space-x-4">
                        <div className={`w-10 h-10 ${iconColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <h3 className="font-medium text-white">{activity.curator?.name}</h3>
                              <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                                {getActivityTypeText(activity.type)}
                              </Badge>
                              <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                                {activity.server?.name}
                              </Badge>
                            </div>
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: ru })}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-300 mb-3">
                            {getActivityDescription(activity)}
                          </p>
                          
                          {activity.content && (
                            <div className="bg-black/30 rounded p-3 mb-3">
                              <p className="text-sm text-gray-200 break-words">
                                "{activity.content}"
                              </p>
                            </div>
                          )}
                          
                          {activity.targetMessageContent && (
                            <div className="bg-gray-700/30 rounded p-3 border-l-2 border-gray-600">
                              <p className="text-xs text-gray-400 mb-1">Исходное сообщение:</p>
                              <p className="text-sm text-gray-300 break-words">
                                "{activity.targetMessageContent}"
                              </p>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-3">
                            <span>Канал: #{activity.channelName || 'неизвестный'}</span>
                            {activity.messageId && (
                              <span>ID: {activity.messageId}</span>
                            )}
                            <span>{new Date(activity.timestamp).toLocaleString('ru-RU')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
