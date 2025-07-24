import { Express } from 'express';

export function setupBackupRoutes(app: Express, storage: any) {
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
      const { importFromBackup } = await import('./import-backup.js');
      await importFromBackup();
      res.json({ success: true, message: 'Данные успешно импортированы из резервной копии' });
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

  // Backup settings endpoints
  app.get('/api/backup/settings', async (req, res) => {
    try {
      const settings = await storage.getBackupSettings();
      
      // If no settings exist, return default settings
      if (!settings) {
        const defaultSettings = {
          frequency: 'daily',
          isActive: true,
          lastBackup: null,
          nextBackup: null
        };
        res.json(defaultSettings);
        return;
      }

      res.json(settings);
    } catch (error) {
      console.error('Error getting backup settings:', error);
      res.status(500).json({ error: 'Ошибка при получении настроек резервного копирования' });
    }
  });

  app.post('/api/backup/settings', async (req, res) => {
    try {
      const { frequency, isActive } = req.body;
      
      if (!frequency) {
        return res.status(400).json({ error: 'Частота резервного копирования обязательна' });
      }

      const validFrequencies = ['hourly', '4hours', '12hours', 'daily', 'weekly', 'monthly'];
      if (!validFrequencies.includes(frequency)) {
        return res.status(400).json({ error: 'Недопустимая частота резервного копирования' });
      }

      const settings = await storage.setBackupSettings({
        frequency,
        isActive: isActive !== false // default to true
      });

      res.json({ success: true, settings });
    } catch (error) {
      console.error('Error saving backup settings:', error);
      res.status(500).json({ error: 'Ошибка при сохранении настроек резервного копирования' });
    }
  });

  app.put('/api/backup/settings', async (req, res) => {
    try {
      const updates = req.body;
      
      if (updates.frequency) {
        const validFrequencies = ['hourly', '4hours', '12hours', 'daily', 'weekly', 'monthly'];
        if (!validFrequencies.includes(updates.frequency)) {
          return res.status(400).json({ error: 'Недопустимая частота резервного копирования' });
        }
      }

      const settings = await storage.updateBackupSettings(updates);
      if (!settings) {
        return res.status(404).json({ error: 'Настройки резервного копирования не найдены' });
      }

      res.json({ success: true, settings });
    } catch (error) {
      console.error('Error updating backup settings:', error);
      res.status(500).json({ error: 'Ошибка при обновлении настроек резервного копирования' });
    }
  });
}