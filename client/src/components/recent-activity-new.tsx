import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { MessageSquare, Heart, Reply } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentActivity {
  id: number;
  type: "message" | "reaction" | "reply";
  content?: string;
  reactionEmoji?: string;
  channelName: string;
  timestamp: string;
  curator: {
    id: number;
    name: string;
    factions: string[];
  };
  server: {
    id: number;
    name: string;
  };
}

function getActivityIcon(type: string) {
  switch (type) {
    case "message":
      return <MessageSquare className="h-4 w-4" />;
    case "reaction":
      return <Heart className="h-4 w-4" />;
    case "reply":
      return <Reply className="h-4 w-4" />;
    default:
      return <MessageSquare className="h-4 w-4" />;
  }
}

function getActivityColor(type: string) {
  switch (type) {
    case "message":
      return "bg-blue-500";
    case "reaction":
      return "bg-red-500";
    case "reply":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
}

function getActivityText(activity: RecentActivity) {
  switch (activity.type) {
    case "message":
      return "отправил сообщение";
    case "reaction":
      return `поставил реакцию ${activity.reactionEmoji}`;
    case "reply":
      return "ответил на сообщение";
    default:
      return "выполнил действие";
  }
}

export function RecentActivity() {
  const { data: activities, isLoading } = useQuery<RecentActivity[]>({
    queryKey: ["/api/activities/recent"]
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>История активности</CardTitle>
          <CardDescription>Последние действия кураторов</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start space-x-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>История активности</CardTitle>
        <CardDescription>
          {activities?.length ? 
            `Последние ${activities.length} действий кураторов` : 
            "Нет недавних активностей"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities?.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {activity.curator.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full ${getActivityColor(activity.type)} flex items-center justify-center`}>
                  <div className="text-white text-xs">
                    {getActivityIcon(activity.type)}
                  </div>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium">{activity.curator.name}</p>
                  <span className="text-sm text-muted-foreground">
                    {getActivityText(activity)}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-1 mt-1">
                  {activity.curator.factions.map((faction, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {faction}
                    </Badge>
                  ))}
                </div>
                
                <div className="mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <span>#{activity.channelName}</span>
                    <span>•</span>
                    <span>{activity.server.name}</span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(activity.timestamp), { 
                        addSuffix: true, 
                        locale: ru 
                      })}
                    </span>
                  </div>
                </div>
                
                {activity.content && (
                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                    {activity.content.length > 100 
                      ? `${activity.content.substring(0, 100)}...` 
                      : activity.content
                    }
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {!activities?.length && (
            <div className="text-center text-muted-foreground py-8">
              Нет недавних активностей для отображения
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}