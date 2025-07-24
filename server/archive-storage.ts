import { db } from './db.js';
import { curators, discordServers, activities, taskReports, responseTracking } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';

// Архивирование данных куратора при удалении
export async function archiveCurator(curatorId: number) {
  try {
    console.log(`📦 Архивирование куратора ID: ${curatorId}`);
    
    // Получаем данные куратора
    const curator = await db.select().from(curators).where(eq(curators.id, curatorId)).limit(1);
    if (curator.length === 0) {
      throw new Error(`Куратор с ID ${curatorId} не найден`);
    }

    // Получаем все связанные данные
    const curatorActivities = await db.select().from(activities).where(eq(activities.curatorId, curatorId));
    const curatorTaskReports = await db.select().from(taskReports).where(eq(taskReports.curatorId, curatorId));
    const curatorResponseTracking = await db.select().from(responseTracking).where(eq(responseTracking.curatorId, curatorId));

    // Создаем архивный объект
    const archiveData = {
      archivedAt: new Date().toISOString(),
      type: 'curator',
      curator: curator[0],
      activities: curatorActivities,
      taskReports: curatorTaskReports,
      responseTracking: curatorResponseTracking,
      stats: {
        totalActivities: curatorActivities.length,
        totalTaskReports: curatorTaskReports.length,
        totalResponseTracking: curatorResponseTracking.length
      }
    };

    // Сохраняем архив в файл
    const archiveDir = 'server/data/archives';
    await fs.mkdir(archiveDir, { recursive: true });
    
    const filename = `curator_${curator[0].name}_${curator[0].discordId}_${Date.now()}.json`;
    const archivePath = path.join(archiveDir, filename);
    
    await fs.writeFile(archivePath, JSON.stringify(archiveData, null, 2));
    
    console.log(`✅ Куратор архивирован: ${archivePath}`);
    console.log(`📊 Архивировано: ${archiveData.stats.totalActivities} активностей, ${archiveData.stats.totalTaskReports} отчетов о задачах`);
    
    return {
      success: true,
      archivePath,
      stats: archiveData.stats
    };
    
  } catch (error) {
    console.error(`❌ Ошибка архивирования куратора ${curatorId}:`, error);
    throw error;
  }
}

// Архивирование данных сервера при удалении
export async function archiveServer(serverId: number) {
  try {
    console.log(`📦 Архивирование сервера ID: ${serverId}`);
    
    // Получаем данные сервера
    const server = await db.select().from(discordServers).where(eq(discordServers.id, serverId)).limit(1);
    if (server.length === 0) {
      throw new Error(`Сервер с ID ${serverId} не найден`);
    }

    // Получаем все связанные данные
    const serverActivities = await db.select().from(activities).where(eq(activities.serverId, serverId));
    const serverTaskReports = await db.select().from(taskReports).where(eq(taskReports.serverId, serverId));
    const serverResponseTracking = await db.select().from(responseTracking).where(eq(responseTracking.serverId, serverId));

    // Создаем архивный объект
    const archiveData = {
      archivedAt: new Date().toISOString(),
      type: 'server',
      server: server[0],
      activities: serverActivities,
      taskReports: serverTaskReports,
      responseTracking: serverResponseTracking,
      stats: {
        totalActivities: serverActivities.length,
        totalTaskReports: serverTaskReports.length,
        totalResponseTracking: serverResponseTracking.length
      }
    };

    // Сохраняем архив в файл
    const archiveDir = 'server/data/archives';
    await fs.mkdir(archiveDir, { recursive: true });
    
    const cleanName = server[0].name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `server_${cleanName}_${server[0].serverId}_${Date.now()}.json`;
    const archivePath = path.join(archiveDir, filename);
    
    await fs.writeFile(archivePath, JSON.stringify(archiveData, null, 2));
    
    console.log(`✅ Сервер архивирован: ${archivePath}`);
    console.log(`📊 Архивировано: ${archiveData.stats.totalActivities} активностей, ${archiveData.stats.totalTaskReports} отчетов о задачах`);
    
    return {
      success: true,
      archivePath,
      stats: archiveData.stats
    };
    
  } catch (error) {
    console.error(`❌ Ошибка архивирования сервера ${serverId}:`, error);
    throw error;
  }
}

// Получение списка архивов
export async function getArchives() {
  try {
    const archiveDir = 'server/data/archives';
    
    try {
      const files = await fs.readdir(archiveDir);
      const archives = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(archiveDir, file);
          const stats = await fs.stat(filePath);
          const content = await fs.readFile(filePath, 'utf-8');
          const data = JSON.parse(content);
          
          archives.push({
            filename: file,
            type: data.type,
            archivedAt: data.archivedAt,
            size: stats.size,
            stats: data.stats,
            entityName: data.type === 'curator' ? data.curator.name : data.server.name
          });
        }
      }
      
      return archives.sort((a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime());
    } catch (error) {
      // Директория не существует
      return [];
    }
  } catch (error) {
    console.error('❌ Ошибка получения списка архивов:', error);
    throw error;
  }
}

// Восстановление данных из архива (при необходимости)
export async function restoreFromArchive(filename: string) {
  try {
    const archiveDir = 'server/data/archives';
    const filePath = path.join(archiveDir, filename);
    
    const content = await fs.readFile(filePath, 'utf-8');
    const archiveData = JSON.parse(content);
    
    console.log(`🔄 Восстановление из архива: ${filename}`);
    
    if (archiveData.type === 'curator') {
      // Восстанавливаем куратора
      await db.insert(curators).values(archiveData.curator).onConflictDoNothing();
      
      // Восстанавливаем активности
      if (archiveData.activities.length > 0) {
        await db.insert(activities).values(archiveData.activities).onConflictDoNothing();
      }
      
      // Восстанавливаем отчеты о задачах
      if (archiveData.taskReports.length > 0) {
        await db.insert(taskReports).values(archiveData.taskReports).onConflictDoNothing();
      }
      
      // Восстанавливаем отслеживание ответов
      if (archiveData.responseTracking.length > 0) {
        await db.insert(responseTracking).values(archiveData.responseTracking).onConflictDoNothing();
      }
      
      console.log(`✅ Куратор ${archiveData.curator.name} восстановлен из архива`);
    } else if (archiveData.type === 'server') {
      // Восстанавливаем сервер
      await db.insert(discordServers).values(archiveData.server).onConflictDoNothing();
      
      // Восстанавливаем активности
      if (archiveData.activities.length > 0) {
        await db.insert(activities).values(archiveData.activities).onConflictDoNothing();
      }
      
      // Восстанавливаем отчеты о задачах
      if (archiveData.taskReports.length > 0) {
        await db.insert(taskReports).values(archiveData.taskReports).onConflictDoNothing();
      }
      
      // Восстанавливаем отслеживание ответов
      if (archiveData.responseTracking.length > 0) {
        await db.insert(responseTracking).values(archiveData.responseTracking).onConflictDoNothing();
      }
      
      console.log(`✅ Сервер ${archiveData.server.name} восстановлен из архива`);
    }
    
    return {
      success: true,
      type: archiveData.type,
      stats: archiveData.stats
    };
    
  } catch (error) {
    console.error(`❌ Ошибка восстановления из архива ${filename}:`, error);
    throw error;
  }
}