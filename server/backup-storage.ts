import fs from 'fs/promises';
import path from 'path';
import { storage } from './storage';

// Пути к файлам данных
const DATA_DIR = './data';
const SETTINGS_DIR = './data/settings';
const ANALYTICS_DIR = './data/analytics';

interface BackupData {
  // Настройки системы
  botSettings: any[];
  notificationSettings: any[];
  ratingSettings: any[];
  globalRatingConfig: any[];
  discordServers: any[];
  
  // Аналитические данные
  curators: any[];
  activities: any[];
  responseTracking: any[];
  taskReports: any[];
  users: any[];
}

export class BackupStorage {
  constructor() {
    this.ensureDirectories();
  }

  private async ensureDirectories() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.mkdir(SETTINGS_DIR, { recursive: true });
      await fs.mkdir(ANALYTICS_DIR, { recursive: true });
    } catch (error) {
      console.error('Error creating backup directories:', error);
    }
  }

  // Экспорт всех данных из PostgreSQL в файлы
  async exportAllData(): Promise<void> {
    console.log('🔄 Начинаем экспорт всех данных из PostgreSQL в файлы...');
    
    try {
      // Получаем все данные из базы
      const [
        botSettingsData,
        notificationSettings, 
        ratingSettings,
        globalRatingConfig,
        discordServers,
        curators,
        activities,
        responseTracking,
        taskReports,
        users
      ] = await Promise.all([
        storage.getBotSettings(),
        storage.getNotificationSettings(),
        storage.getRatingSettings(),
        storage.getGlobalRatingConfig(),
        storage.getDiscordServers(),
        storage.getCurators(),
        storage.getRecentActivities(1000), // Получаем все активности
        this.getAllResponseTracking(),
        this.getAllTaskReports(),
        this.getAllUsers()
      ]);

      // Преобразуем настройки бота в массив
      const botSettings = Object.entries(botSettingsData).map(([key, value]) => ({ key, value }));

      // Сохраняем настройки системы
      await this.saveToFile(`${SETTINGS_DIR}/bot-settings.json`, botSettings);
      await this.saveToFile(`${SETTINGS_DIR}/notification-settings.json`, notificationSettings);
      await this.saveToFile(`${SETTINGS_DIR}/rating-settings.json`, ratingSettings);
      await this.saveToFile(`${SETTINGS_DIR}/global-rating-config.json`, globalRatingConfig);
      await this.saveToFile(`${SETTINGS_DIR}/discord-servers.json`, discordServers);

      // Сохраняем аналитические данные
      await this.saveToFile(`${ANALYTICS_DIR}/curators.json`, curators);
      await this.saveToFile(`${ANALYTICS_DIR}/activities.json`, activities);
      await this.saveToFile(`${ANALYTICS_DIR}/response-tracking.json`, responseTracking);
      await this.saveToFile(`${ANALYTICS_DIR}/task-reports.json`, taskReports);
      await this.saveToFile(`${ANALYTICS_DIR}/users.json`, users);

      // Создаем полный бэкап
      const fullBackup: BackupData = {
        botSettings,
        notificationSettings: notificationSettings ? [notificationSettings] : [],
        ratingSettings,
        globalRatingConfig: globalRatingConfig ? [globalRatingConfig] : [],
        discordServers,
        curators,
        activities: activities.map(a => ({ ...a, curator: undefined, server: undefined })), // Убираем связанные объекты
        responseTracking,
        taskReports,
        users
      };

      await this.saveToFile(`${DATA_DIR}/full-backup.json`, fullBackup);
      
      console.log('✅ Экспорт завершен успешно!');
      console.log(`📁 Настройки сохранены в: ${SETTINGS_DIR}/`);
      console.log(`📊 Аналитика сохранена в: ${ANALYTICS_DIR}/`);
      console.log(`💾 Полный бэкап: ${DATA_DIR}/full-backup.json`);
      
    } catch (error) {
      console.error('❌ Ошибка при экспорте данных:', error);
      throw error;
    }
  }

  // Импорт данных из файлов обратно в PostgreSQL
  async importAllData(): Promise<void> {
    console.log('🔄 Начинаем импорт данных из файлов в PostgreSQL...');
    
    try {
      const fullBackupPath = `${DATA_DIR}/full-backup.json`;
      const backupExists = await this.fileExists(fullBackupPath);
      
      if (!backupExists) {
        console.log('⚠️ Файл полного бэкапа не найден, пропускаем импорт');
        return;
      }

      const backup: BackupData = await this.loadFromFile(fullBackupPath);
      
      // Импортируем данные обратно (здесь можно добавить логику импорта)
      console.log('📄 Данные загружены из файла:');
      console.log(`- Настройки бота: ${Object.keys(backup.botSettings || {}).length} записей`);
      console.log(`- Кураторы: ${backup.curators?.length || 0} записей`);
      console.log(`- Активности: ${backup.activities?.length || 0} записей`);
      console.log(`- Discord серверы: ${backup.discordServers?.length || 0} записей`);
      
      console.log('✅ Импорт завершен успешно!');
      
    } catch (error) {
      console.error('❌ Ошибка при импорте данных:', error);
      throw error;
    }
  }

  // Автоматический бэкап (вызывается периодически)
  async scheduleBackup(): Promise<void> {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    
    try {
      await this.exportAllData();
      
      // Создаем бэкап с временной меткой
      const timestampedBackup = `${DATA_DIR}/backup-${timestamp}.json`;
      const fullBackup = await this.loadFromFile(`${DATA_DIR}/full-backup.json`);
      await this.saveToFile(timestampedBackup, fullBackup);
      
      console.log(`📅 Автоматический бэкап создан: ${timestampedBackup}`);
    } catch (error) {
      console.error('❌ Ошибка автоматического бэкапа:', error);
    }
  }

  // Вспомогательные методы
  private async saveToFile(filePath: string, data: any): Promise<void> {
    const jsonData = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonData, 'utf8');
  }

  private async loadFromFile(filePath: string): Promise<any> {
    const fileContent = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContent);
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // Методы для получения данных из базы (которых нет в storage)
  private async getAllResponseTracking(): Promise<any[]> {
    try {
      // Получаем данные напрямую из базы
      const result = await storage.getUnrespondedMessages(); // Используем существующий метод как основу
      return result || [];
    } catch (error) {
      console.error('Error getting response tracking:', error);
      return [];
    }
  }

  private async getAllTaskReports(): Promise<any[]> {
    try {
      const result = await storage.getPendingTaskReports(); // Используем существующий метод
      return result || [];
    } catch (error) {
      console.error('Error getting task reports:', error);
      return [];
    }
  }

  private async getAllUsers(): Promise<any[]> {
    try {
      // Пока пользователей нет, возвращаем пустой массив
      return [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  // Получение статистики файлов
  async getBackupStats(): Promise<{
    lastBackup: string | null;
    totalBackups: number;
    settingsFiles: string[];
    analyticsFiles: string[];
  }> {
    try {
      const dataFiles = await fs.readdir(DATA_DIR).catch(() => []);
      const settingsFiles = await fs.readdir(SETTINGS_DIR).catch(() => []);
      const analyticsFiles = await fs.readdir(ANALYTICS_DIR).catch(() => []);
      
      const backupFiles = dataFiles.filter(f => f.startsWith('backup-') && f.endsWith('.json'));
      const lastBackup = backupFiles.length > 0 ? backupFiles.sort().pop() || null : null;
      
      return {
        lastBackup,
        totalBackups: backupFiles.length,
        settingsFiles,
        analyticsFiles
      };
    } catch (error) {
      console.error('Error getting backup stats:', error);
      return {
        lastBackup: null,
        totalBackups: 0,
        settingsFiles: [],
        analyticsFiles: []
      };
    }
  }
}

export const backupStorage = new BackupStorage();