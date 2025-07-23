import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCuratorSchema, insertDiscordServerSchema } from "@shared/schema";
import { startDiscordBot } from "./discord-bot";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Discord servers
  const defaultServers = [
    { serverId: "728355725121945731", name: "Government" },
    { serverId: "728356233161080853", name: "FIB" },
    { serverId: "728352953924321430", name: "LSPD" },
    { serverId: "728587491908780044", name: "SANG" },
    { serverId: "728354790081560597", name: "LSCSD" },
    { serverId: "728354410832330782", name: "EMS" },
    { serverId: "728355269532188793", name: "Weazel News" },
    { serverId: "825137602553708544", name: "Detectives" },
  ];

  // Ensure default servers exist
  for (const server of defaultServers) {
    const existing = await storage.getServerByServerId(server.serverId);
    if (!existing) {
      await storage.createDiscordServer(server);
    }
  }

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Curators endpoints
  app.get("/api/curators", async (req, res) => {
    try {
      const { type } = req.query;
      let curators;
      
      if (type === 'government' || type === 'crime') {
        curators = await storage.getCuratorsByType(type);
      } else {
        curators = await storage.getCurators();
      }
      
      res.json(curators);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch curators" });
    }
  });

  app.post("/api/curators", async (req, res) => {
    try {
      const parsed = insertCuratorSchema.parse(req.body);
      const curator = await storage.createCurator(parsed);
      res.json(curator);
    } catch (error) {
      res.status(400).json({ error: "Invalid curator data" });
    }
  });

  app.get("/api/curators/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const curator = await storage.getCuratorById(id);
      if (!curator) {
        return res.status(404).json({ error: "Curator not found" });
      }
      res.json(curator);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch curator" });
    }
  });

  app.get("/api/curators/:id/activities", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { startDate, endDate } = req.query;
      
      let activities;
      if (startDate && endDate) {
        activities = await storage.getActivitiesByPeriod(id, new Date(startDate as string), new Date(endDate as string));
      } else {
        activities = await storage.getActivitiesByCurator(id);
      }
      
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch curator activities" });
    }
  });

  app.put("/api/curators/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parsed = insertCuratorSchema.partial().parse(req.body);
      const curator = await storage.updateCurator(id, parsed);
      if (!curator) {
        return res.status(404).json({ error: "Curator not found" });
      }
      res.json(curator);
    } catch (error) {
      res.status(400).json({ error: "Invalid curator data" });
    }
  });

  app.delete("/api/curators/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCurator(id);
      if (!success) {
        return res.status(404).json({ error: "Curator not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete curator" });
    }
  });

  // Activities endpoints
  app.get("/api/activities/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent activities" });
    }
  });

  app.get("/api/activities/curator/:curatorId", async (req, res) => {
    try {
      const curatorId = parseInt(req.params.curatorId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const activities = await storage.getActivitiesByCurator(curatorId, limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch curator activities" });
    }
  });

  // Server status
  app.get("/api/servers", async (req, res) => {
    try {
      const servers = await storage.getDiscordServers();
      res.json(servers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch servers" });
    }
  });

  app.post("/api/servers", async (req, res) => {
    try {
      const parsed = insertDiscordServerSchema.parse(req.body);
      const server = await storage.createDiscordServer(parsed);
      res.json(server);
    } catch (error) {
      res.status(400).json({ error: "Invalid server data" });
    }
  });

  app.put("/api/servers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parsed = insertDiscordServerSchema.partial().parse(req.body);
      const server = await storage.updateDiscordServer(id, parsed);
      if (!server) {
        return res.status(404).json({ error: "Server not found" });
      }
      res.json(server);
    } catch (error) {
      res.status(400).json({ error: "Invalid server data" });
    }
  });

  // Curator statistics
  app.get("/api/curator-stats", async (req, res) => {
    try {
      const curatorId = req.query.curatorId ? parseInt(req.query.curatorId as string) : undefined;
      const stats = await storage.getCuratorStats(curatorId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch curator stats" });
    }
  });

  app.get("/api/activities/daily", async (req, res) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      const dailyStats = await storage.getDailyActivityStats(days);
      res.json(dailyStats);
    } catch (error) {
      console.error("Daily stats error:", error);
      res.status(500).json({ error: "Failed to fetch daily activity stats" });
    }
  });

  app.get("/api/curators/top", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    console.log("NEW - Fetching top curators with limit:", limit);
    
    try {
      const topCurators = await storage.getTopCurators(limit);
      console.log("NEW - Got top curators result:", JSON.stringify(topCurators, null, 2));
      res.json(topCurators);
    } catch (error) {
      console.log("NEW - Error in top curators route:", error);
      res.json([]);
    }
  });

  // Test endpoint to verify changes are working
  app.get("/api/test-curators", async (req, res) => {
    console.log("Test endpoint called");
    const curators = await storage.getCurators();
    console.log("Test - found curators:", curators.length);
    res.json({ message: "Test working", curators: curators.length });
  });

  // Individual curator details
  app.get("/api/curators/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const curator = await storage.getCuratorById(id);
      if (!curator) {
        return res.status(404).json({ error: "Curator not found" });
      }
      res.json(curator);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch curator" });
    }
  });

  // Curator activities
  app.get("/api/activities/curator/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const activities = await storage.getActivitiesByCurator(id, 50);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch curator activities" });
    }
  });

  // Curator stats
  app.get("/api/curators/:id/stats", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const stats = await storage.getCuratorStats(id);
      res.json(stats[0] || { totalActivities: 0, messages: 0, reactions: 0, replies: 0, score: 0 });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch curator stats" });
    }
  });

  // Start Discord bot
  startDiscordBot();

  const httpServer = createServer(app);
  return httpServer;
}
