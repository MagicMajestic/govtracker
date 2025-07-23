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
  
  // Top curators endpoint - test route
  app.get("/api/top-curators", async (req, res) => {
    console.log("=== TOP CURATORS ROUTE STARTED ===");
    
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      console.log("Limit:", limit);
      
      const topCurators = await storage.getTopCurators(limit);
      console.log("=== SENDING TOP CURATORS ===");
      console.log("Count:", topCurators.length);
      console.log("Data:", JSON.stringify(topCurators, null, 2));
      
      res.json(topCurators);
    } catch (error: any) {
      console.error("=== ERROR IN TOP CURATORS ROUTE ===");
      console.error("Error:", error);
      console.error("Stack:", error?.stack);
      res.status(500).json({ error: "Failed to fetch top curators" });
    }
  });
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



  // Server status with connection info
  app.get("/api/servers/status", async (req, res) => {
    try {
      const servers = await storage.getDiscordServers();
      const serversWithStatus = servers.map(server => ({
        ...server,
        isConnected: server.serverId === "825137602553708544", // Only Detectives is connected
        lastActivity: null,
        totalActivities: 0
      }));
      res.json(serversWithStatus);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch server status" });
    }
  });



  // Test endpoint to create response tracking data
  app.post("/api/test-response-tracking", async (req, res) => {
    try {
      console.log("Creating test response tracking data...");
      
      // Get first available curator and server
      const curators = await storage.getCurators();
      const servers = await storage.getDiscordServers();
      
      if (curators.length === 0 || servers.length === 0) {
        return res.json({ error: "Need curators and servers first" });
      }
      
      const curator = curators[0];
      const server = servers[0];
      
      // Create several test response tracking records with different times
      const testTimes = [15, 25, 8, 45, 12, 30, 18, 22]; // Various response times in seconds
      
      for (let i = 0; i < testTimes.length; i++) {
        const now = new Date();
        const mentionTime = new Date(now.getTime() - (testTimes[i] + 60) * 1000); // Message was sent X+60 seconds ago
        const responseTime = new Date(now.getTime() - 60 * 1000); // Response was X seconds later
        
        await storage.createResponseTracking({
          serverId: server.id,
          curatorId: curator.id,
          mentionMessageId: `test_mention_${i}_${Date.now()}`,
          mentionTimestamp: mentionTime,
          responseMessageId: `test_response_${i}_${Date.now()}`,
          responseTimestamp: responseTime,
          responseType: i % 2 === 0 ? 'reply' : 'reaction',
          responseTimeSeconds: testTimes[i]
        });
      }
      
      console.log(`Created ${testTimes.length} test response tracking records`);
      res.json({ 
        success: true, 
        message: `Created ${testTimes.length} test response tracking records`,
        averageTime: testTimes.reduce((a, b) => a + b, 0) / testTimes.length 
      });
    } catch (error) {
      console.error("Error creating test data:", error);
      res.status(500).json({ error: "Failed to create test data" });
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

  // Server stats with activity details
  app.get("/api/servers/stats", async (req, res) => {
    try {
      const serverStats = await storage.getServerStats();
      res.json(serverStats);
    } catch (error) {
      console.error("Error getting server stats:", error);
      res.status(500).json({ error: "Failed to fetch server stats" });
    }
  });

  // Start Discord bot
  startDiscordBot();

  const httpServer = createServer(app);
  return httpServer;
}
