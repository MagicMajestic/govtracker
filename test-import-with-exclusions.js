// Тест импорта с исключениями кураторов
const { spawn } = require('child_process');
const { readFileSync, writeFileSync } = require('fs');

async function testImportWithExclusions() {
  console.log('🧪 Тестируем импорт с исключенными кураторами...');
  
  try {
    // Читаем текущий бэкап
    const backupData = JSON.parse(readFileSync('./data/full-backup.json', 'utf-8'));
    
    // Добавляем тестового куратора в бэкап
    const testCurator = {
      id: 999,
      discordId: "999888777",
      name: "FiredCurator",
      factions: ["test"],
      curatorType: "government",
      isActive: true
    };
    
    // Добавляем куратора в бэкап если его там еще нет
    const existingCurator = backupData.curators.find(c => c.discordId === testCurator.discordId);
    if (!existingCurator) {
      backupData.curators.push(testCurator);
      writeFileSync('./data/full-backup.json', JSON.stringify(backupData, null, 2));
      console.log('✅ Добавлен тестовый куратор в бэкап');
    }
    
    // Запускаем импорт через API
    const response = await fetch('http://localhost:5000/api/import-backup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    console.log('📊 Результат импорта:', result);
    
    // Проверяем что куратор исключен из импорта
    const curatorsResponse = await fetch('http://localhost:5000/api/curators');
    const curators = await curatorsResponse.json();
    
    const importedCurator = curators.find(c => c.discordId === testCurator.discordId);
    if (importedCurator) {
      console.log('❌ ОШИБКА: Исключенный куратор был импортирован!');
    } else {
      console.log('✅ УСПЕХ: Исключенный куратор НЕ был импортирован');
    }
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error);
  }
}

testImportWithExclusions();