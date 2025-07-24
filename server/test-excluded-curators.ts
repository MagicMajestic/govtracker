import { storage } from './storage.js';

// Функция для тестирования системы исключенных кураторов
async function testExcludedCurators() {
  console.log('🧪 Testing excluded curators system...');
  
  try {
    // Проверяем текущий список исключенных кураторов
    const excluded = await storage.getExcludedCurators();
    console.log(`📋 Current excluded curators: ${excluded.length}`);
    excluded.forEach(curator => {
      console.log(`🚫 ${curator.name} (${curator.discordId}) - ${curator.reason || 'No reason provided'}`);
    });
    
    // Добавляем тестового исключенного куратора "Test" если его еще нет
    const testDiscordId = '123456789';
    const existingTest = excluded.find(c => c.discordId === testDiscordId);
    
    if (!existingTest) {
      const testCurator = await storage.addExcludedCurator({
        discordId: testDiscordId,
        name: 'Test',
        reason: 'Уволен - тестовый куратор'
      });
      console.log(`✅ Added test excluded curator:`, testCurator);
    } else {
      console.log(`⚠️ Test curator already excluded`);
    }
    
    // Проверяем обновленный список
    const updatedExcluded = await storage.getExcludedCurators();
    console.log(`📋 Updated excluded curators list: ${updatedExcluded.length}`);
    
    console.log('✅ Excluded curators system test completed successfully');
    
  } catch (error) {
    console.error('❌ Error testing excluded curators:', error);
  }
}

// Запускаем тест если файл вызван напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  testExcludedCurators().then(() => process.exit(0));
}

export { testExcludedCurators };