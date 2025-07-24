// Ручной экспорт данных для тестирования
import { storage } from './storage.js';
import fs from 'fs/promises';

const DATA_DIR = './data';
const SETTINGS_DIR = './data/settings';
const ANALYTICS_DIR = './data/analytics';
const SERVERS_DIR = './data/servers';
const CURATORS_DIR = './data/curators';

async function ensureDirectories() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(SETTINGS_DIR, { recursive: true });
  await fs.mkdir(ANALYTICS_DIR, { recursive: true });
  await fs.mkdir(SERVERS_DIR, { recursive: true });
  await fs.mkdir(CURATORS_DIR, { recursive: true });
}

async function saveToFile(filePath: string, data: any) {
  const jsonData = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, jsonData, 'utf8');
}

export async function manualExport() {
  console.log('🔄 Начинаем ручной экспорт всех данных из PostgreSQL в файлы...');
  
  try {
    await ensureDirectories();

    // Получаем все данные из базы
    const botSettings = await storage.getBotSettings();
    const notificationSettings = await storage.getNotificationSettings();
    const ratingSettings = await storage.getRatingSettings();
    const globalRatingConfig = await storage.getGlobalRatingConfig();
    const discordServers = await storage.getDiscordServers();
    const curators = await storage.getCurators();
    const activities = await storage.getRecentActivities(1000);
    
    // Получаем отчеты о задачах и отслеживание ответов
    const taskReports = await storage.getAllTaskReports();
    const responseTracking = await storage.getAllResponseTracking();

    // Преобразуем настройки бота в массив
    const botSettingsArray = Object.entries(botSettings).map(([key, value]) => ({ key, value }));

    // Сохраняем настройки системы
    await saveToFile(`${SETTINGS_DIR}/bot-settings.json`, botSettingsArray);
    await saveToFile(`${SETTINGS_DIR}/notification-settings.json`, notificationSettings);
    await saveToFile(`${SETTINGS_DIR}/rating-settings.json`, ratingSettings);
    await saveToFile(`${SETTINGS_DIR}/global-rating-config.json`, globalRatingConfig);
    await saveToFile(`${SETTINGS_DIR}/discord-servers.json`, discordServers);

    // Сохраняем аналитические данные
    await saveToFile(`${ANALYTICS_DIR}/curators.json`, curators);
    await saveToFile(`${ANALYTICS_DIR}/activities.json`, activities);
    await saveToFile(`${ANALYTICS_DIR}/task-reports.json`, taskReports);
    await saveToFile(`${ANALYTICS_DIR}/response-tracking.json`, responseTracking);

    // Создаем детальную статистику по каждому серверу отдельно
    console.log(`📊 Создаем статистику для ${discordServers.length} серверов...`);
    for (const server of discordServers) {
      console.log(`🔄 Обрабатываем сервер: ${server.name}`);
      const serverActivities = activities.filter(a => a.serverId === server.id);
      const serverTaskReports = taskReports.filter(tr => tr.serverId === server.id);
      const serverResponseTracking = responseTracking.filter(rt => rt.serverId === server.id);
      
      // Группируем активности по дням для анализа трендов
      const activitiesByDay = serverActivities.reduce((acc, activity) => {
        if (!activity.timestamp) return acc;
        const date = new Date(activity.timestamp).toISOString().split('T')[0];
        if (!acc[date]) acc[date] = { messages: 0, reactions: 0, replies: 0, task_verification: 0 };
        acc[date][activity.type] = (acc[date][activity.type] || 0) + 1;
        return acc;
      }, {} as Record<string, Record<string, number>>);

      // Группируем время ответа по дням
      const responseTimeByDay = serverResponseTracking.reduce((acc, rt) => {
        if (!rt.mentionTimestamp) return acc;
        const date = new Date(rt.mentionTimestamp).toISOString().split('T')[0];
        if (!acc[date]) acc[date] = { times: [], count: 0 };
        if (rt.responseTimeSeconds) {
          acc[date].times.push(rt.responseTimeSeconds);
          acc[date].count++;
        }
        return acc;
      }, {} as Record<string, { times: number[], count: number }>);

      // Вычисляем среднее время ответа по дням
      const avgResponseTimeByDay = Object.entries(responseTimeByDay).reduce((acc, [date, data]) => {
        acc[date] = data.times.length > 0 ? Math.round(data.times.reduce((sum, time) => sum + time, 0) / data.times.length) : 0;
        return acc;
      }, {} as Record<string, number>);
      
      const serverStats = {
        server: {
          id: server.id,
          name: server.name,
          serverId: server.serverId,
          roleTagId: server.roleTagId,
          completedTasksChannelId: server.completedTasksChannelId
        },
        summary: {
          totalActivities: serverActivities.length,
          messages: serverActivities.filter(a => a.type === 'message').length,
          reactions: serverActivities.filter(a => a.type === 'reaction').length,
          replies: serverActivities.filter(a => a.type === 'reply').length,
          taskVerifications: serverActivities.filter(a => a.type === 'task_verification').length,
          totalTaskReports: serverTaskReports.length,
          pendingTasks: serverTaskReports.filter(tr => tr.status === 'pending').length,
          verifiedTasks: serverTaskReports.filter(tr => tr.status === 'verified').length,
          avgResponseTime: serverResponseTracking.length > 0 
            ? Math.round(serverResponseTracking.reduce((sum, rt) => sum + (rt.responseTimeSeconds || 0), 0) / serverResponseTracking.length)
            : null,
          responseTrackingCount: serverResponseTracking.length
        },
        dailyStats: {
          activitiesByDay,
          avgResponseTimeByDay
        },
        fullData: {
          activities: serverActivities,
          taskReports: serverTaskReports,
          responseTracking: serverResponseTracking
        },
        exportedAt: new Date().toISOString()
      };
      
      // Очищаем имя сервера от специальных символов для имени файла
      const safeServerName = server.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      console.log(`💾 Сохраняем статистику сервера: ${safeServerName}_complete.json`);
      await saveToFile(`${SERVERS_DIR}/${safeServerName}_complete.json`, serverStats);
    }

    // Создаем детальную статистику по каждому куратору отдельно
    console.log(`👥 Создаем статистику для ${curators.length} кураторов...`);
    for (const curator of curators) {
      console.log(`🔄 Обрабатываем куратора: ${curator.name}`);
      const curatorActivities = activities.filter(a => a.curatorId === curator.id);
      const curatorTaskReports = taskReports.filter(tr => tr.curatorId === curator.id);
      const curatorResponseTracking = responseTracking.filter(rt => rt.curatorId === curator.id);
      
      // Группируем активности по дням
      const activitiesByDay = curatorActivities.reduce((acc, activity) => {
        if (!activity.timestamp) return acc;
        const date = new Date(activity.timestamp).toISOString().split('T')[0];
        if (!acc[date]) acc[date] = { messages: 0, reactions: 0, replies: 0, task_verification: 0 };
        acc[date][activity.type] = (acc[date][activity.type] || 0) + 1;
        return acc;
      }, {} as Record<string, Record<string, number>>);

      // Группируем активности по серверам
      const activitiesByServer = curatorActivities.reduce((acc, activity) => {
        const server = discordServers.find(s => s.id === activity.serverId);
        const serverName = server?.name || 'Unknown';
        if (!acc[serverName]) acc[serverName] = { messages: 0, reactions: 0, replies: 0, task_verification: 0 };
        acc[serverName][activity.type] = (acc[serverName][activity.type] || 0) + 1;
        return acc;
      }, {} as Record<string, Record<string, number>>);

      // Время ответа по дням
      const responseTimeByDay = curatorResponseTracking.reduce((acc, rt) => {
        if (!rt.mentionTimestamp) return acc;
        const date = new Date(rt.mentionTimestamp).toISOString().split('T')[0];
        if (!acc[date]) acc[date] = { times: [], count: 0 };
        if (rt.responseTimeSeconds) {
          acc[date].times.push(rt.responseTimeSeconds);
          acc[date].count++;
        }
        return acc;
      }, {} as Record<string, { times: number[], count: number }>);

      const avgResponseTimeByDay = Object.entries(responseTimeByDay).reduce((acc, [date, data]) => {
        acc[date] = data.times.length > 0 ? Math.round(data.times.reduce((sum, time) => sum + time, 0) / data.times.length) : 0;
        return acc;
      }, {} as Record<string, number>);

      const curatorStats = {
        curator: {
          id: curator.id,
          name: curator.name,
          discordId: curator.discordId,
          factions: curator.factions,
          curatorType: curator.curatorType,
          subdivision: curator.subdivision
        },
        summary: {
          totalActivities: curatorActivities.length,
          messages: curatorActivities.filter(a => a.type === 'message').length,
          reactions: curatorActivities.filter(a => a.type === 'reaction').length,
          replies: curatorActivities.filter(a => a.type === 'reply').length,
          taskVerifications: curatorActivities.filter(a => a.type === 'task_verification').length,
          totalTaskReports: curatorTaskReports.length,
          verifiedTasks: curatorTaskReports.filter(tr => tr.status === 'verified').length,
          avgResponseTime: curatorResponseTracking.length > 0 
            ? Math.round(curatorResponseTracking.reduce((sum, rt) => sum + (rt.responseTimeSeconds || 0), 0) / curatorResponseTracking.length)
            : null,
          responseTrackingCount: curatorResponseTracking.length
        },
        dailyStats: {
          activitiesByDay,
          avgResponseTimeByDay
        },
        serverStats: {
          activitiesByServer
        },
        fullData: {
          activities: curatorActivities,
          taskReports: curatorTaskReports,
          responseTracking: curatorResponseTracking
        },
        exportedAt: new Date().toISOString()
      };
      
      // Очищаем имя куратора от специальных символов для имени файла
      const safeCuratorName = curator.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      console.log(`💾 Сохраняем статистику куратора: ${safeCuratorName}_complete.json`);
      await saveToFile(`${CURATORS_DIR}/${safeCuratorName}_complete.json`, curatorStats);
    }

    // Создаем полный бэкап
    const fullBackup = {
      botSettings: botSettingsArray,
      notificationSettings: notificationSettings ? [notificationSettings] : [],
      ratingSettings,
      globalRatingConfig: globalRatingConfig ? [globalRatingConfig] : [],
      discordServers,
      curators,
      activities: activities.map(a => ({ ...a, curator: undefined, server: undefined })),
      responseTracking: responseTracking.map((rt: any) => ({ ...rt, curator: undefined, server: undefined })),
      taskReports: taskReports.map((tr: any) => ({ ...tr, curator: undefined, server: undefined })),
      users: []
    };

    await saveToFile(`${DATA_DIR}/full-backup.json`, fullBackup);
    
    console.log('✅ Ручной экспорт завершен успешно!');
    console.log(`📁 Настройки системы: ${SETTINGS_DIR}/`);
    console.log(`📊 Общая аналитика: ${ANALYTICS_DIR}/`);
    console.log(`🎯 Детализация по серверам: ${SERVERS_DIR}/`);
    console.log(`👥 Детализация по кураторам: ${CURATORS_DIR}/`);
    console.log(`💾 Полный бэкап: ${DATA_DIR}/full-backup.json`);
    
    return fullBackup;
    
  } catch (error) {
    console.error('❌ Ошибка при ручном экспорте данных:', error);
    throw error;
  }
}

// Запускаем экспорт, если файл выполняется напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  manualExport().catch(console.error);
}