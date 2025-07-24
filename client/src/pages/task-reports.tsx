import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Clock, User, Calendar, MessageSquare, RefreshCw } from "lucide-react";
import { DatePickerWithRange, QuickDateRanges } from "@/components/date-range-picker";
import { DateRange } from "react-day-picker";

interface TaskReport {
  id: number;
  serverId: number;
  submitterId: string;
  submitterName: string;
  messageId: string;
  channelId: string;
  content: string;
  weekStart: string;
  submittedAt: string;
  status: 'pending' | 'verified';
  curatorId?: number;
  verifiedAt?: string;
  curatorFaction?: string;
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

  // Fetch servers
  const { data: servers = [], refetch: refetchServers } = useQuery<Server[]>({
    queryKey: ['/api/servers', dateRange],
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
    refetchInterval: 30000,
  });

  // Fetch task reports
  const { data: taskReports = [], refetch: refetchReports } = useQuery<TaskReport[]>({
    queryKey: ['/api/task-reports', dateRange, selectedServer, statusFilter],
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
    refetchInterval: 10000,
  });

  // Fetch task statistics
  const { data: taskStats = [], refetch: refetchStats } = useQuery<TaskStats[]>({
    queryKey: ['/api/task-reports/stats'],
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

        {/* Date Range Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 bg-gray-800/50 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <span className="text-sm text-gray-300 font-medium">Период отчетов:</span>
            <DatePickerWithRange 
              date={dateRange}
              onDateChange={setDateRange}
            />
          </div>
          <QuickDateRanges onDateChange={setDateRange} />
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
                              <span>Отправитель: {report.submitterName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>Подано: {formatDate(report.submittedAt)}</span>
                            </div>
                            {report.verifiedAt && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                <span>Проверено: {formatDate(report.verifiedAt)}</span>
                                {report.curatorFaction && (
                                  <span className="text-blue-400">({report.curatorFaction})</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm font-medium text-blue-400">
                            Отчет #{report.id}
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-[#2a2a2a] p-2 rounded border border-gray-600">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-400">Содержание отчета:</span>
                        </div>
                        <p className="text-sm text-gray-300">{report.content}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid gap-6">
            {taskStats.map((stat) => (
              <Card key={stat.serverId} className="bg-[#1a1a1a] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">{stat.serverName}</CardTitle>
                  <CardDescription className="text-gray-400">
                    Статистика проверки задач
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Ожидают</p>
                      <p className="text-xl font-bold text-yellow-400">{stat.pendingReports}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Проверено</p>
                      <p className="text-xl font-bold text-green-400">{stat.verifiedReports}</p>
                    </div>
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