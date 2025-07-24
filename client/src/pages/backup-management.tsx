import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, Clock, FileText, Database, AlertCircle, Settings } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface BackupStats {
  lastBackup: string | null;
  totalBackups: number;
  settingsFiles: string[];
  analyticsFiles: string[];
}

interface BackupSettings {
  frequency: string;
  isActive: boolean;
  lastBackup?: string | null;
  nextBackup?: string | null;
}

export default function BackupManagement() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Получение статистики резервных копий
  const { data: backupStats, isLoading } = useQuery<BackupStats>({
    queryKey: ['/api/backup/stats'],
    refetchInterval: 5000,
  });

  // Получение настроек резервного копирования
  const { data: backupSettings, isLoading: settingsLoading } = useQuery<BackupSettings>({
    queryKey: ['/api/backup/settings'],
    refetchInterval: 10000,
  });

  // Экспорт данных
  const exportMutation = useMutation({
    mutationFn: () => 
      fetch('/api/backup/export', { method: 'POST' }).then(res => res.json()),
    onMutate: () => setIsExporting(true),
    onSuccess: (data) => {
      toast({
        title: "Экспорт завершен",
        description: data.message || "Все данные успешно экспортированы в файлы JSON",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/backup/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка экспорта",
        description: error.message || "Не удалось экспортировать данные",
        variant: "destructive",
      });
    },
    onSettled: () => setIsExporting(false),
  });

  // Импорт данных
  const importMutation = useMutation({
    mutationFn: () => 
      fetch('/api/backup/import', { method: 'POST' }).then(res => res.json()),
    onMutate: () => setIsImporting(true),
    onSuccess: (data) => {
      toast({
        title: "Импорт завершен", 
        description: data.message || "Все данные успешно импортированы из файлов JSON",
      });
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка импорта",
        description: error.message || "Не удалось импортировать данные",
        variant: "destructive",
      });
    },
    onSettled: () => setIsImporting(false),
  });

  // Создание автоматической резервной копии
  const scheduleBackupMutation = useMutation({
    mutationFn: () => 
      fetch('/api/backup/schedule', { method: 'POST' }).then(res => res.json()),
    onSuccess: (data) => {
      toast({
        title: "Резервная копия создана",
        description: data.message || "Автоматическая резервная копия успешно создана",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/backup/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка создания резервной копии",
        description: error.message || "Не удалось создать резервную копию",
        variant: "destructive",
      });
    },
  });

  // Сохранение настроек резервного копирования
  const saveSettingsMutation = useMutation({
    mutationFn: (settings: { frequency: string; isActive: boolean }) =>
      fetch('/api/backup/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Настройки сохранены",
        description: "Настройки частоты резервного копирования обновлены",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/backup/settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка сохранения",
        description: error.message || "Не удалось сохранить настройки",
        variant: "destructive",
      });
    },
  });

  // Функция для сохранения частоты
  const handleFrequencyChange = (frequency: string) => {
    saveSettingsMutation.mutate({
      frequency,
      isActive: backupSettings?.isActive ?? true,
    });
  };

  // Функция для переключения активности
  const handleActiveToggle = (isActive: boolean) => {
    saveSettingsMutation.mutate({
      frequency: backupSettings?.frequency || 'daily',
      isActive,
    });
  };

  // Функция для перевода частоты
  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      hourly: 'Каждый час',
      '4hours': 'Каждые 4 часа',
      '12hours': 'Каждые 12 часов',
      daily: 'Ежедневно',
      weekly: 'Еженедельно',
      monthly: 'Ежемесячно',
    };
    return labels[frequency] || frequency;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Управление резервными копиями</h1>
          <p className="text-muted-foreground mt-2">
            Экспорт и импорт данных в файлы JSON для надежного хранения
          </p>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Система сохраняет данные в PostgreSQL и дублирует их в файлы JSON для дополнительной надежности.
          Файлы позволяют легко редактировать данные и создавать резервные копии вручную.
        </AlertDescription>
      </Alert>

      {/* Статистика резервных копий */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Последняя резервная копия</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : backupStats?.lastBackup ? 
                new Date(backupStats.lastBackup).toLocaleString('ru-RU') : 
                "Отсутствует"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего резервных копий</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : backupStats?.totalBackups || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Файлов данных</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : 
                (backupStats?.settingsFiles.length || 0) + (backupStats?.analyticsFiles.length || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Настройки автоматического резервного копирования */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-500" />
            Настройки автоматического резервного копирования
          </CardTitle>
          <CardDescription>
            Конфигурация частоты создания резервных копий без нагрузки на систему
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="backup-active">Автоматическое резервное копирование</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="backup-active"
                    checked={backupSettings?.isActive ?? true}
                    onCheckedChange={handleActiveToggle}
                    disabled={settingsLoading || saveSettingsMutation.isPending}
                  />
                  <Label htmlFor="backup-active" className="text-sm">
                    {backupSettings?.isActive ? 'Включено' : 'Отключено'}
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backup-frequency">Частота резервного копирования</Label>
                <Select
                  value={backupSettings?.frequency || 'daily'}
                  onValueChange={handleFrequencyChange}
                  disabled={settingsLoading || saveSettingsMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите частоту" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Каждый час</SelectItem>
                    <SelectItem value="4hours">Каждые 4 часа</SelectItem>
                    <SelectItem value="12hours">Каждые 12 часов</SelectItem>
                    <SelectItem value="daily">Ежедневно</SelectItem>
                    <SelectItem value="weekly">Еженедельно</SelectItem>
                    <SelectItem value="monthly">Ежемесячно</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Текущие настройки:</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• <strong>Частота:</strong> {getFrequencyLabel(backupSettings?.frequency || 'daily')}</p>
                <p>• <strong>Статус:</strong> {backupSettings?.isActive ? '🟢 Активно' : '🔴 Отключено'}</p>
                <p>• <strong>Нагрузка:</strong> Минимальная</p>
                <p>• <strong>Восстановление:</strong> По любому периоду</p>
              </div>
              
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Система создает отдельные файлы по кураторам и серверам для быстрого доступа к данным 
                  без нагрузки на основную базу данных.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Управление данными */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Экспорт данных
            </CardTitle>
            <CardDescription>
              Сохранить все данные из PostgreSQL в файлы JSON
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Данные будут сохранены в папки:
              <br />• <code>data/settings/</code> - настройки системы
              <br />• <code>data/analytics/</code> - аналитические данные
              <br />• <code>data/full-backup.json</code> - полная резервная копия
            </p>
            <Button 
              onClick={() => exportMutation.mutate()}
              disabled={isExporting}
              className="w-full"
            >
              {isExporting ? "Экспортирую..." : "Экспортировать все данные"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Импорт данных
            </CardTitle>
            <CardDescription>
              Загрузить данные из файлов JSON обратно в PostgreSQL
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Система загрузит данные из файла <code>data/full-backup.json</code> 
              и восстановит состояние базы данных.
            </p>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Внимание: Импорт может перезаписать текущие данные в базе
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => importMutation.mutate()}
              disabled={isImporting}
              variant="outline"
              className="w-full"
            >
              {isImporting ? "Импортирую..." : "Импортировать из файлов"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Файлы данных */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Файлы настроек</CardTitle>
            <CardDescription>Конфигурация системы</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {isLoading ? (
                <p className="text-muted-foreground">Загрузка...</p>
              ) : backupStats?.settingsFiles.length ? (
                backupStats.settingsFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-mono">{file}</span>
                    <Badge variant="secondary">Настройки</Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">Файлы настроек не найдены</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Файлы аналитики</CardTitle>
            <CardDescription>Данные кураторов и активности</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {isLoading ? (
                <p className="text-muted-foreground">Загрузка...</p>
              ) : backupStats?.analyticsFiles.length ? (
                backupStats.analyticsFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-mono">{file}</span>
                    <Badge variant="secondary">Аналитика</Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">Файлы аналитики не найдены</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Автоматические резервные копии */}
      <Card>
        <CardHeader>
          <CardTitle>Автоматические резервные копии</CardTitle>
          <CardDescription>
            Создание резервных копий с временными метками
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Создать резервную копию с временной меткой для архивирования
            </p>
            <Button 
              onClick={() => scheduleBackupMutation.mutate()}
              disabled={scheduleBackupMutation.isPending}
              variant="secondary"
            >
              {scheduleBackupMutation.isPending ? "Создаю..." : "Создать резервную копию"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}