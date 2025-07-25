import type { Express } from "express";
import { validateUser, createSession, destroySession, getSession } from "./auth.js";

export function setupAuthRoutes(app: Express) {
  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      const user = await validateUser(username, password);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = createSession(user);
      
      // Set cookie and return user info
      res.cookie('session', token, { 
        httpOnly: true, 
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      res.json({ 
        success: true, 
        user: { 
          username: user.username, 
          role: user.role, 
          displayName: user.displayName 
        },
        token
      });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.session;
    
    if (token) {
      destroySession(token);
    }
    
    res.clearCookie('session');
    res.json({ success: true });
  });

  // Current user endpoint
  app.get("/api/auth/me", (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.session;
    
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const session = getSession(token);
    if (!session) {
      return res.status(401).json({ error: "Invalid session" });
    }

    res.json({
      username: session.username,
      role: session.role,
      displayName: session.displayName
    });
  });
}