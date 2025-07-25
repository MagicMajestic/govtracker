import type { Express } from "express";
import { setupAuthRoutes } from "./auth-routes.js";
import { requireAuth } from "./middleware.js";
import { registerRoutes } from "./routes.js";

export async function setupMainRoutes(app: Express) {
  // Setup authentication routes first (no auth required for these)
  setupAuthRoutes(app);

  // Apply authentication middleware to all API routes (except auth routes)
  app.use("/api", (req, res, next) => {
    // Skip auth for login/logout/me routes
    if (req.path.startsWith('/auth/') || req.originalUrl.includes('/api/auth/')) {
      return next();
    }
    return requireAuth(req, res, next);
  });

  // Register all other routes (now protected by auth)
  return await registerRoutes(app);
}