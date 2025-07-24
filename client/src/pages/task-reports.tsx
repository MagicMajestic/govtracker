import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Clock, User, Calendar, MessageSquare, RefreshCw } from "lucide-react";
import { DatePickerWithRange, QuickDateRanges, DateTimeToggle } from "@/components/date-range-picker";
import { DateRange } from "react-day-picker";

interface TaskReport {
  id: number;
  serverId: number;
  authorId: string;
  authorName: string;
  messageId: string;
  channelId: string;
  content: string;
  taskCount: number;
  weekStart: string;
  submittedAt: string;
  status: 'pending' | 'verified';
  curatorId?: number;
  curatorName?: string;
  curatorDiscordId?: string;
  checkedAt?: string;
  approvedTasks?: number;
}

interface TaskStats {
  serverId: number;
  serverName: string;
  pendingReports: number;
  verifiedReports: number;
  totalReports: number;
}

interface Server {
  id: number;
  serverId: string;
  name: string;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function getStatusBadge(status: string) {
  if (status === 'pending') {
    return <Badge variant="outline" className="text-yellow-400 border-yellow-400">Ожидает</Badge>;
  }
  return <Badge className="bg-green-500">Проверено</Badge>;
}

export default function TaskReports() {
  const [selectedServer, setSelectedServer] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [showTime, setShowTime] = useState<boolean>(false);

  // Stable string keys for React Query
  const dateFromKey = dateRange?.from ? dateRange.from.getTime().toString() : 'null';
  const dateToKey = dateRange?.to ? dateRange.to.getTime().toString() : 'null';

  // Fetch servers
  const { data: servers = [], refetch: refetchServers } = useQuery<Server[]>({
    queryKey: ['/api/servers', dateFromKey, dateToKey],
    queryFn: () => {
      const params = new URLSearchParams();
      if (dateRange?.from) {
        params.append('dateFrom', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.append('dateTo', dateRange.to.toISOString());
      }
      return fetch(`/api/servers?${params.toString()}`).then(res => res.json());
    },
    staleTime: 30000,
    refetchInterval: 30000,
  });

  // Fetch task reports
  const { data: taskReports = [], refetch: refetchReports } = useQuery<TaskReport[]>({
    queryKey: ['/api/task-reports', dateFromKey, dateToKey, selectedServer, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (dateRange?.from) {
        params.append('dateFrom', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.append('dateTo', dateRange.to.toISOString());
      }
      if (selectedServer !== 'all') {
        params.append('serverId', selectedServer);
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      return fetch(`/api/task-reports?${params.toString()}`).then(res => res.json());
    },
    staleTime: 30000,
    refetchInterval: 10000,
  });

  // Fetch task statistics
  const { data: taskStats = [], refetch: refetchStats } = useQuery<TaskStats[]>({
    queryKey: ['/api/task-reports/stats'],
    staleTime: 30000,
    refetchInterval: 10000,
  });

  // Filter reports
  const filteredReports = taskReports.filter(report => {
    if (selectedServer !== "all" && report.serverId !== parseInt(selectedServer)) {
      return false;
    }
    if (statusFilter !== "all" && report.status !== statusFilter) {
      return false;
    }
    return true;
  });

  // Calculate totals
  const totalPending = taskStats.reduce((sum, stat) => sum + stat.pendingReports, 0);
  const totalVerified = taskStats.reduce((sum, stat) => sum + stat.verifiedReports, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Отчеты о задачах</h1>
            <p className="text-gray-400 mt-2">
              Мониторинг и верификация выполненных задач в каналах completed-tasks
            </p>
          </div>
          <Button 
            onClick={() => {
              refetchServers();
              refetchReports();
              refetchStats();
            }}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Обновить
          </Button>
        </div>

        {/* Date Range Filters - Compact Layout */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-3 lg:space-y-0 lg:space-x-4">
            <span className="text-sm text-gray-300 font-medium">Период отчетов:</span>
            
            <div className="flex flex-wrap items-center gap-2">
              <DatePickerWithRange 
                date={dateRange}
                onDateChange={setDateRange}
                showTime={showTime}
              />
              <DateTimeToggle 
                showTime={showTime}
                onToggle={setShowTime}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRange(undefined)}
                className="text-xs"
              >
                Сбросить
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <QuickDateRanges onDateChange={setDateRange} />
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#1a1a1a] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Ожидают проверки</p>
                <p className="text-2xl font-bold text-yellow-400">{totalPending}</p>
              </div>
              <Clock className="h-6 w-6 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Проверено</p>
                <p className="text-2xl font-bold text-green-400">{totalVerified}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList className="bg-[#1a1a1a] border-gray-700">
          <TabsTrigger value="reports" className="data-[state=active]:bg-blue-600">
            Отчеты о задачах
          </TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-blue-600">
            Статистика по серверам
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-6">
          {/* Filters */}
          <div className="flex gap-4">
            <Select value={selectedServer} onValueChange={setSelectedServer}>
              <SelectTrigger className="w-[200px] bg-[#1a1a1a] border-gray-700 text-white">
                <SelectValue placeholder="Выберите сервер" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-gray-700">
                <SelectItem value="all">Все серверы</SelectItem>
                {servers.map((server) => (
                  <SelectItem key={server.id} value={server.id.toString()}>
                    {server.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px] bg-[#1a1a1a] border-gray-700 text-white">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-gray-700">
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="pending">Ожидают</SelectItem>
                <SelectItem value="verified">Проверено</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Task Reports List */}
          <div className="space-y-4">
            {filteredReports.length === 0 ? (
              <Card className="bg-[#1a1a1a] border-gray-700">
                <CardContent className="p-6 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Отчеты о задачах не найдены</p>
                </CardContent>
              </Card>
            ) : (
              filteredReports.map((report) => {
                const server = servers.find(s => s.id === report.serverId);
                return (
                  <Card key={report.id} className="bg-[#1a1a1a] border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-white">
                              {server?.name || 'Unknown Server'}
                            </h3>
                            {getStatusBadge(report.status)}
                          </div>
                          
                          <div className="text-sm text-gray-400 space-y-1">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>Отправитель: {report.authorName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>Подано: {formatDate(report.submittedAt)}</span>
                            </div>
                            {report.checkedAt && report.curatorName && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                <span>Проверено куратором {report.curatorName}: {formatDate(report.checkedAt)}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-3 p-3 bg-gray-800 rounded text-sm">
                            <p className="text-gray-300">{report.content}</p>

                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <div className="text-2xl font-bold text-blue-400">
                            {report.taskCount}
                          </div>

                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          {/* Server Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {taskStats.map((stat) => (
              <Card key={stat.serverId} className="bg-[#1a1a1a] border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-white">{stat.serverName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ожидают:</span>
                    <span className="text-yellow-400 font-semibold">{stat.pendingReports}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Проверено:</span>
                    <span className="text-green-400 font-semibold">{stat.verifiedReports}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Всего:</span>
                    <span className="text-blue-400 font-semibold">{stat.totalReports}</span>
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