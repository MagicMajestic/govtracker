import { Express } from 'express';

export function setupBackupRoutes(app: Express) {
  // Backup and file storage routes
  app.post('/api/backup/export', async (req, res) => {
    try {
      const { manualExport } = await import('./manual-export.js');
      const result = await manualExport();
      res.json({ success: true, message: 'Данные успешно экспортированы в файлы', data: result });
    } catch (error) {
      console.error('Error exporting data:', error);
      res.status(500).json({ error: 'Ошибка при экспорте данных' });
    }
  });

  app.post('/api/backup/import', async (req, res) => {
    try {
      // Здесь будет логика импорта данных из файлов
      res.json({ success: true, message: 'Импорт данных из файлов (в разработке)' });
    } catch (error) {
      console.error('Error importing data:', error);
      res.status(500).json({ error: 'Ошибка при импорте данных' });
    }
  });

  app.get('/api/backup/stats', async (req, res) => {
    try {
      const fs = await import('fs/promises');
      
      // Проверяем существование файлов
      let settingsFiles: string[] = [];
      let analyticsFiles: string[] = [];
      let lastBackup: string | null = null;
      
      try {
        const settingsDir = await fs.readdir('./server/data/settings');
        settingsFiles = settingsDir.filter(f => f.endsWith('.json'));
      } catch {}
      
      try {
        const analyticsDir = await fs.readdir('./server/data/analytics');
        analyticsFiles = analyticsDir.filter(f => f.endsWith('.json'));
      } catch {}
      
      try {
        const fullBackupStats = await fs.stat('./server/data/full-backup.json');
        lastBackup = fullBackupStats.mtime.toISOString();
      } catch {}
      
      const stats = {
        lastBackup,
        totalBackups: settingsFiles.length + analyticsFiles.length + 1,
        settingsFiles,
        analyticsFiles
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Error getting backup stats:', error);
      res.status(500).json({ error: 'Ошибка при получении статистики резервных копий' });
    }
  });

  app.post('/api/backup/schedule', async (req, res) => {
    try {
      const { manualExport } = await import('./manual-export.js');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Создаем резервную копию с временной меткой
      const result = await manualExport();
      
      // Копируем полный бэкап с временной меткой
      const fs = await import('fs/promises');
      const backupFileName = `./server/data/backup-${timestamp}.json`;
      await fs.copyFile('./server/data/full-backup.json', backupFileName);
      
      res.json({ 
        success: true, 
        message: `Автоматическая резервная копия создана: backup-${timestamp}.json`,
        filename: backupFileName
      });
    } catch (error) {
      console.error('Error creating scheduled backup:', error);
      res.status(500).json({ error: 'Ошибка при создании автоматической резервной копии' });
    }
  });
}