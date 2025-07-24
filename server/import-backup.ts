import { readFileSync } from 'fs';
import { storage } from './storage.js';

interface BackupData {
  botSettings: Array<{key: string, value: string}>;
  notificationSettings: any[];
  ratingSettings: any[];
  globalRatingConfig: any[];
  discordServers: any[];
  curators: any[];
  activities: any[];
  responseTracking: any[];
  taskReports: any[];
}

export async function importFromBackup() {
  try {
    console.log('🔄 Starting data import from backup...');
    
    // Читаем полный бэкап
    const backupData: BackupData = JSON.parse(readFileSync('./data/full-backup.json', 'utf-8'));
    
    // Импортируем настройки бота
    console.log('📝 Importing bot settings...');
    for (const setting of backupData.botSettings) {
      await storage.setBotSetting(setting.key, setting.value);
      console.log(`✅ Imported bot setting: ${setting.key} = ${setting.value}`);
    }
    
    // Импортируем настройки уведомлений
    if (backupData.notificationSettings && backupData.notificationSettings.length > 0) {
      console.log('🔔 Importing notification settings...');
      for (const notification of backupData.notificationSettings) {
        await storage.updateNotificationSettings({
          notificationServerId: notification.notificationServerId,
          notificationChannelId: notification.notificationChannelId,
          isActive: notification.isActive
        });
        console.log(`✅ Imported notification settings: Server ${notification.notificationServerId}`);
      }
    }
    
    // Импортируем настройки рейтингов
    if (backupData.ratingSettings && backupData.ratingSettings.length > 0) {
      console.log('⭐ Importing rating settings...');
      for (const rating of backupData.ratingSettings) {
        await storage.createRatingSettings({
          ratingName: rating.ratingName,
          ratingText: rating.ratingText,
          minScore: rating.minScore,
          color: rating.color
        });
        console.log(`✅ Imported rating: ${rating.ratingText} (${rating.minScore}+ points)`);
      }
    }
    
    // Пропускаем глобальную конфигурацию рейтингов - она будет создана автоматически
    console.log('⚠️ Skipping global rating config import - will use defaults');
    
    // Импортируем Discord серверы
    if (backupData.discordServers && backupData.discordServers.length > 0) {
      console.log('🌐 Importing Discord servers...');
      for (const server of backupData.discordServers) {
        try {
          // Пытаемся создать сервер, если уже существует - пропускаем
          await storage.createDiscordServer({
            serverId: server.serverId,
            name: server.name,
            roleTagId: server.roleTagId,
            isActive: server.isActive,
            completedTasksChannelId: server.completedTasksChannelId
          });
          console.log(`✅ Imported Discord server: ${server.name} (${server.serverId})`);
        } catch (error) {
          if (error.code === '23505') {
            console.log(`⚠️ Discord server already exists: ${server.name} (${server.serverId})`);
          } else {
            console.log(`❌ Error importing server ${server.name}:`, error.message);
          }
        }
      }
    }
    
    // Импортируем кураторов
    if (backupData.curators && backupData.curators.length > 0) {
      console.log('👥 Importing curators...');
      for (const curator of backupData.curators) {
        try {
          await storage.createCurator({
            discordId: curator.discordId,
            name: curator.name,
            factions: curator.factions || [],
            curatorType: curator.curatorType || 'government'
          });
          console.log(`✅ Imported curator: ${curator.name} (${curator.discordId})`);
        } catch (error) {
          if (error.code === '23505') {
            console.log(`⚠️ Curator already exists: ${curator.name} (${curator.discordId})`);
          } else {
            console.log(`❌ Error importing curator ${curator.name}:`, error.message);
          }
        }
      }
    }
    
    // Импортируем активности
    if (backupData.activities && backupData.activities.length > 0) {
      console.log('📊 Importing activities...');
      let importedActivities = 0;
      for (const activity of backupData.activities) {
        try {
          await storage.logActivity({
            curatorId: activity.curatorId,
            serverId: activity.serverId,
            type: activity.type as 'message' | 'reaction' | 'reply' | 'task_verification',
            channelId: activity.channelId,
            channelName: activity.channelName || 'Unknown',
            messageId: activity.messageId,
            content: activity.content,
            reactionEmoji: activity.reactionEmoji,
            targetMessageId: activity.targetMessageId,
            targetMessageContent: activity.targetMessageContent,
            timestamp: new Date(activity.timestamp)
          });
          importedActivities++;
        } catch (error) {
          console.log(`⚠️ Skipped activity ID ${activity.id}: ${error.message}`);
        }
      }
      console.log(`✅ Imported ${importedActivities} activities`);
    }
    
    // Импортируем отслеживание ответов
    if (backupData.responseTracking && backupData.responseTracking.length > 0) {
      console.log('⏱️ Importing response tracking...');
      let importedResponses = 0;
      for (const response of backupData.responseTracking) {
        try {
          await storage.createResponseTracking({
            serverId: response.serverId,
            curatorId: response.curatorId,
            mentionMessageId: response.mentionMessageId,
            mentionTimestamp: new Date(response.mentionTimestamp),
            responseMessageId: response.responseMessageId,
            responseTimestamp: response.responseTimestamp ? new Date(response.responseTimestamp) : null,
            responseType: response.responseType,
            responseTimeSeconds: response.responseTimeSeconds
          });
          importedResponses++;
        } catch (error) {
          console.log(`⚠️ Skipped response tracking (might already exist): ${response.mentionMessageId}`);
        }
      }
      console.log(`✅ Imported ${importedResponses} response tracking records`);
    }
    
    // Импортируем отчеты о задачах
    if (backupData.taskReports && backupData.taskReports.length > 0) {
      console.log('📋 Importing task reports...');
      let importedTasks = 0;
      for (const task of backupData.taskReports) {
        try {
          // Обновляем serverId для соответствия текущей схеме базы данных
          const actualServerId = task.serverId === 9 
            ? 19  // TEST server ID в новой базе
            : task.serverId;
            
          await storage.createTaskReport({
            serverId: actualServerId,
            authorId: task.authorId,
            authorName: task.authorName,
            messageId: task.messageId,
            channelId: task.channelId,
            content: task.content || 'Imported task report',
            taskCount: task.taskCount,
            submittedAt: new Date(task.submittedAt),
            weekStart: new Date(task.weekStart),
            status: task.status,
            curatorId: task.curatorId || null,
            curatorDiscordId: task.curatorDiscordId || null,
            curatorName: task.curatorName || null,
            checkedAt: task.checkedAt ? new Date(task.checkedAt) : null,
            approvedTasks: task.approvedTasks || 0
          });
          importedTasks++;
          console.log(`✅ Imported task report: ${task.messageId} for server ${actualServerId}`);
        } catch (error) {
          console.log(`❌ Failed to import task report ${task.messageId}: ${error.message}`);
        }
      }
      console.log(`✅ Imported ${importedTasks} task reports`);
    }
    
    console.log('✅ Data import completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Error during data import:', error);
    return false;
  }
}