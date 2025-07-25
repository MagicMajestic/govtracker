import { Request, Response, NextFunction } from 'express';
import { getSession } from './auth.js';

// Расширяем типы Express для добавления пользователя в запрос
declare global {
  namespace Express {
    interface Request {
      user?: {
        username: string;
        role: string;
        displayName: string;
      };
    }
  }
}

// Middleware для проверки аутентификации
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Исключаем API для входа
  if (req.path === '/api/auth/login' || req.path === '/api/auth/logout') {
    return next();
  }

  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.session;
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const session = getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  req.user = {
    username: session.username,
    role: session.role,
    displayName: session.displayName
  };

  next();
}

// Middleware для проверки роли администратора
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}