// Ручной экспорт данных для тестирования
import { storage } from './storage.js';
import fs from 'fs/promises';

const DATA_DIR = './data';
const SETTINGS_DIR = './data/settings';
const ANALYTICS_DIR = './data/analytics';

async function ensureDirectories() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(SETTINGS_DIR, { recursive: true });
  await fs.mkdir(ANALYTICS_DIR, { recursive: true });
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

    // Создаем полный бэкап
    const fullBackup = {
      botSettings: botSettingsArray,
      notificationSettings: notificationSettings ? [notificationSettings] : [],
      ratingSettings,
      globalRatingConfig: globalRatingConfig ? [globalRatingConfig] : [],
      discordServers,
      curators,
      activities: activities.map(a => ({ ...a, curator: undefined, server: undefined })),
      responseTracking: [],
      taskReports: [],
      users: []
    };

    await saveToFile(`${DATA_DIR}/full-backup.json`, fullBackup);
    
    console.log('✅ Ручной экспорт завершен успешно!');
    console.log(`📁 Настройки сохранены в: ${SETTINGS_DIR}/`);
    console.log(`📊 Аналитика сохранена в: ${ANALYTICS_DIR}/`);
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