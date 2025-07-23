import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Heart, Reply, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

export function RecentActivity() {
  const { data: activities, refetch, isLoading } = useQuery({
    queryKey: ["/api/activities/recent"],
    refetchInterval: 30000, // Refresh every 30 seconds
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

  const getActivityText = (activity: any) => {
    switch (activity.type) {
      case "message":
        return `отправил сообщение в #${activity.channelName || 'канал'}`;
      case "reaction":
        return `поставил реакцию ${activity.reactionEmoji} на сообщение в #${activity.channelName || 'канал'}`;
      case "reply":
        return `ответил на сообщение в #${activity.channelName || 'канал'}`;
      default:
        return "выполнил действие";
    }
  };

  return (
    <Card className="surface border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-white">Последняя активность</CardTitle>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
          className="text-blue-400 hover:text-blue-300"
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin">
          {!activities || activities.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Нет недавней активности</p>
          ) : (
            activities.map((activity: any) => {
              const Icon = getActivityIcon(activity.type);
              const iconColor = getActivityColor(activity.type);
              
              return (
                <div key={activity.id} className="flex items-start space-x-3 p-3 surface-light rounded-lg">
                  <div className={`w-8 h-8 ${iconColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">
                      <span className="font-medium">{activity.curator?.name}</span>
                      <span className="text-gray-400 ml-1">{getActivityText(activity)}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {activity.server?.name} • {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: ru })}
                    </p>
                    {(activity.content || activity.targetMessageContent) && (
                      <p className="text-xs text-gray-300 mt-2 bg-black/30 p-2 rounded max-w-full break-words">
                        "{activity.content || activity.targetMessageContent}"
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
