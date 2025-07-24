// Тест системы резервного копирования
import { backupStorage } from './server/backup-storage.js';

console.log('🔄 Запуск тестового экспорта данных в файлы...');

backupStorage.exportAllData()
  .then(() => {
    console.log('✅ Экспорт данных завершен успешно!');
    return backupStorage.getBackupStats();
  })
  .then(stats => {
    console.log('📊 Статистика резервных копий:');
    console.log(JSON.stringify(stats, null, 2));
  })
  .catch(error => {
    console.error('❌ Ошибка при экспорте:', error);
  });