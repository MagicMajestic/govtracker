import { storage } from './storage';

/**
 * Initialize default settings and data for new installations
 * This ensures all necessary data is persisted in PostgreSQL
 */
export async function initializeSystemDefaults() {
  console.log('🔄 Initializing system defaults...');
  
  try {
    // Initialize bot settings
    await initializeBotSettings();
    
    // Initialize notification settings
    await initializeNotificationSettings();
    
    // Initialize rating settings
    await initializeRatingSettings();
    
    // Initialize global rating config
    await initializeGlobalRatingConfig();
    
    console.log('✅ System defaults initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing system defaults:', error);
  }
}

async function initializeBotSettings() {
  const defaultSettings = [
    { key: 'monitoringEnabled', value: 'true', description: 'Enable Discord activity monitoring' },
    { key: 'curatorNotificationEnabled', value: 'true', description: 'Enable curator notifications' },
    { key: 'notificationDelay', value: '300', description: 'Notification delay in seconds' },
    { key: 'keywordDetection', value: 'true', description: 'Enable keyword detection for curator mentions' },
    { key: 'logLevel', value: 'info', description: 'Bot logging level' },
    { key: 'repeatNotifications', value: 'false', description: 'Enable repeat notifications' },
    { key: 'allowedChannels', value: '', description: 'Comma-separated list of allowed channel IDs' },
    { key: 'customKeywords', value: 'куратор,curator,помощь,help,вопрос,question', description: 'Custom keywords for detection' }
  ];
  
  for (const setting of defaultSettings) {
    const existing = await storage.getBotSetting(setting.key);
    if (!existing) {
      await storage.setBotSetting(setting.key, setting.value, setting.description);
      console.log(`✅ Initialized bot setting: ${setting.key} = ${setting.value}`);
    }
  }
}

async function initializeNotificationSettings() {
  const existing = await storage.getNotificationSettings();
  if (!existing) {
    await storage.setNotificationSettings({
      notificationServerId: '805026457327108126', // GOS FAMQ server
      notificationChannelId: '974783377465036861'  // flood-all channel
    });
    console.log('✅ Initialized notification settings');
  }
}

async function initializeRatingSettings() {
  const existing = await storage.getRatingSettings();
  if (existing.length === 0) {
    const defaultRatings = [
      { ratingName: 'excellent', ratingText: 'Великолепно', minScore: 50, color: 'text-green-400' },
      { ratingName: 'good', ratingText: 'Хорошо', minScore: 35, color: 'text-blue-400' },
      { ratingName: 'normal', ratingText: 'Нормально', minScore: 20, color: 'text-yellow-400' },
      { ratingName: 'poor', ratingText: 'Плохо', minScore: 10, color: 'text-orange-400' },
      { ratingName: 'terrible', ratingText: 'Ужасно', minScore: 0, color: 'text-red-400' }
    ];
    
    for (const rating of defaultRatings) {
      await storage.createRatingSettings(rating);
      console.log(`✅ Initialized rating: ${rating.ratingText} (${rating.minScore}+ points)`);
    }
  }
}

async function initializeGlobalRatingConfig() {
  const existing = await storage.getGlobalRatingConfig();
  if (!existing) {
    await storage.updateGlobalRatingConfig({
      activityPointsMessage: 3,
      activityPointsReaction: 1,
      activityPointsReply: 2,
      activityPointsTaskVerification: 5,
      responseTimeGoodSeconds: 60,
      responseTimePoorSeconds: 300
    });
    console.log('✅ Initialized global rating config');
  }
}