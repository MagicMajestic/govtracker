import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

interface User {
  username: string;
  password: string;
  role: string;
  displayName: string;
}

interface UsersFile {
  users: User[];
}

const USERS_FILE = path.join(process.cwd(), 'server', 'users.json');

// Загрузка пользователей из файла
export async function loadUsers(): Promise<User[]> {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    const usersFile: UsersFile = JSON.parse(data);
    return usersFile.users;
  } catch (error) {
    console.error('Error loading users:', error);
    return [];
  }
}

// Проверка учетных данных
export async function validateUser(username: string, password: string): Promise<User | null> {
  const users = await loadUsers();
  const user = users.find(u => u.username === username && u.password === password);
  return user || null;
}

// Генерация сессионного токена
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Хранилище сессий (в памяти)
const sessions = new Map<string, { username: string; role: string; displayName: string; createdAt: Date }>();

// Создание сессии
export function createSession(user: User): string {
  const token = generateSessionToken();
  sessions.set(token, {
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    createdAt: new Date()
  });
  return token;
}

// Получение сессии
export function getSession(token: string) {
  return sessions.get(token);
}

// Удаление сессии
export function destroySession(token: string): void {
  sessions.delete(token);
}

// Очистка старых сессий (старше 24 часов)
export function cleanupSessions(): void {
  const now = new Date();
  const maxAge = 24 * 60 * 60 * 1000; // 24 часа
  
  const entries = Array.from(sessions.entries());
  for (const [token, session] of entries) {
    if (now.getTime() - session.createdAt.getTime() > maxAge) {
      sessions.delete(token);
    }
  }
}

// Запуск очистки сессий каждый час
setInterval(cleanupSessions, 60 * 60 * 1000);