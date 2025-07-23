import { 
  curators, 
  activities, 
  discordServers,
  users,
  responseTracking,
  botSettings,
  ratingSettings,
  globalRatingConfig,
  taskReports,
  type Curator, 
  type InsertCurator,
  type Activity,
  type InsertActivity,
  type DiscordServer,
  type InsertDiscordServer,
  type User,
  type InsertUser,
  type ResponseTracking,
  type InsertResponseTracking,
  type BotSettings,
  type InsertBotSettings,
  type RatingSettings,
  type InsertRatingSettings,
  type GlobalRatingConfig,
  type InsertGlobalRatingConfig,
  type TaskReport,
  type InsertTaskReport
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";
import { connectedServers } from "./discord-bot";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Curator methods
  getCurators(): Promise<Curator[]>;
  getCuratorById(id: number): Promise<Curator | undefined>;
  getCuratorByDiscordId(discordId: string): Promise<Curator | undefined>;
  getCuratorsByType(curatorType: 'government' | 'government_crimea' | 'crime'): Promise<Curator[]>;
  getCuratorsBySubdivision(subdivision: 'government' | 'crimea'): Promise<Curator[]>;
  createCurator(curator: InsertCurator): Promise<Curator>;
  updateCurator(id: number, curator: Partial<InsertCurator>): Promise<Curator | undefined>;
  deleteCurator(id: number): Promise<boolean>;
  
  // Activity methods
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivitiesByCurator(curatorId: number, limit?: number): Promise<Activity[]>;
  getActivitiesByPeriod(curatorId: number, startDate: Date, endDate: Date): Promise<Activity[]>;
  getRecentActivities(limit?: number): Promise<(Activity & { curator: Curator, server: DiscordServer })[]>;
  getActivitiesInDateRange(startDate: Date, endDate: Date): Promise<Activity[]>;
  getActivitiesForServer(serverId: number): Promise<Activity[]>;
  
  // Discord server methods
  getDiscordServers(): Promise<DiscordServer[]>;
  createDiscordServer(server: InsertDiscordServer): Promise<DiscordServer>;
  getServerByServerId(serverId: string): Promise<DiscordServer | undefined>;
  updateDiscordServer(id: number, server: Partial<InsertDiscordServer>): Promise<DiscordServer | undefined>;
  deleteDiscordServer(id: number): Promise<boolean>;
  
  // Response tracking methods
  createResponseTracking(tracking: InsertResponseTracking): Promise<ResponseTracking>;
  updateResponseTracking(id: number, tracking: Partial<InsertResponseTracking>): Promise<ResponseTracking | undefined>;
  getResponseTrackingByMention(mentionMessageId: string): Promise<ResponseTracking | undefined>;
  getUnrespondedMessages(): Promise<ResponseTracking[]>;
  getCuratorAvgResponseTime(curatorId: number): Promise<number | null>;

  // Bot settings methods
  getBotSettings(): Promise<Record<string, string>>;
  setBotSetting(key: string, value: string, description?: string): Promise<void>;
  getBotSetting(key: string, defaultValue?: string): Promise<string | null>;
  
  // Rating settings methods
  getRatingSettings(): Promise<RatingSettings[]>;
  createRatingSettings(settings: InsertRatingSettings): Promise<RatingSettings>;
  updateRatingSettings(id: number, settings: Partial<InsertRatingSettings>): Promise<RatingSettings | undefined>;
  getRatingByName(name: string): Promise<RatingSettings | undefined>;
  initializeDefaultRatingSettings(): Promise<void>;
  
  // Global rating config methods
  getGlobalRatingConfig(): Promise<GlobalRatingConfig | undefined>;
  updateGlobalRatingConfig(config: Partial<InsertGlobalRatingConfig>): Promise<GlobalRatingConfig | undefined>;
  initializeDefaultGlobalConfig(): Promise<void>;
  
  // Task report methods
  createTaskReport(report: InsertTaskReport): Promise<TaskReport>;
  updateTaskReport(id: number, report: Partial<InsertTaskReport>): Promise<TaskReport | undefined>;
  getTaskReportByMessageId(messageId: string): Promise<TaskReport | undefined>;
  getTaskReportsForServer(serverId: number): Promise<TaskReport[]>;
  getPendingTaskReports(): Promise<TaskReport[]>;
  getTaskReportsByWeek(weekStart: Date): Promise<TaskReport[]>;
  getCuratorTaskStats(curatorId: number): Promise<{
    totalChecked: number;
    totalApproved: number;
    averageApprovalRate: number;
  }>;
  
  // Statistics methods
  getCuratorStats(curatorId?: number): Promise<any>;
  getDashboardStats(): Promise<any>;
  getDailyActivityStats(days: number): Promise<any>;
  getTopCurators(limit: number): Promise<any>;
  getServerStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Curator methods
  async getCurators(): Promise<Curator[]> {
    return await db.select().from(curators).where(eq(curators.isActive, true));
  }

  async getCuratorById(id: number): Promise<Curator | undefined> {
    const [curator] = await db.select().from(curators).where(eq(curators.id, id));
    return curator || undefined;
  }

  async getCuratorByDiscordId(discordId: string): Promise<Curator | undefined> {
    const [curator] = await db.select().from(curators).where(eq(curators.discordId, discordId));
    return curator || undefined;
  }

  async getCuratorsByType(curatorType: 'government' | 'government_crimea' | 'crime'): Promise<Curator[]> {
    return await db.select().from(curators).where(and(eq(curators.isActive, true), eq(curators.curatorType, curatorType)));
  }

  async getCuratorsBySubdivision(subdivision: 'government' | 'crimea'): Promise<Curator[]> {
    return await db.select().from(curators).where(and(eq(curators.isActive, true), eq(curators.subdivision, subdivision)));
  }

  async createCurator(curator: InsertCurator): Promise<Curator> {
    const [newCurator] = await db
      .insert(curators)
      .values(curator)
      .returning();
    return newCurator;
  }

  async updateCurator(id: number, curator: Partial<InsertCurator>): Promise<Curator | undefined> {
    const [updated] = await db
      .update(curators)
      .set(curator)
      .where(eq(curators.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCurator(id: number): Promise<boolean> {
    const [updated] = await db
      .update(curators)
      .set({ isActive: false })
      .where(eq(curators.id, id))
      .returning();
    return !!updated;
  }

  // Activity methods
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db
      .insert(activities)
      .values(activity)
      .returning();
    return newActivity;
  }

  async getActivitiesByCurator(curatorId: number, limit = 100): Promise<Activity[]> {
    const results = await db
      .select({
        id: activities.id,
        curatorId: activities.curatorId,
        serverId: activities.serverId,
        type: activities.type,
        channelId: activities.channelId,
        channelName: activities.channelName,
        messageId: activities.messageId,
        content: activities.content,
        reactionEmoji: activities.reactionEmoji,
        targetMessageId: activities.targetMessageId,
        targetMessageContent: activities.targetMessageContent,
        timestamp: activities.timestamp,
        server: discordServers,
      })
      .from(activities)
      .leftJoin(discordServers, eq(activities.serverId, discordServers.id))
      .where(eq(activities.curatorId, curatorId))
      .orderBy(desc(activities.timestamp))
      .limit(limit);
      
    return results.map(r => ({
      id: r.id,
      curatorId: r.curatorId,
      serverId: r.serverId,
      type: r.type,
      channelId: r.channelId,
      channelName: r.channelName,
      messageId: r.messageId,
      content: r.content,
      reactionEmoji: r.reactionEmoji,
      targetMessageId: r.targetMessageId,
      targetMessageContent: r.targetMessageContent,
      timestamp: r.timestamp,
      server: r.server || { id: r.serverId, name: "Unknown Server", serverId: "", isActive: false, createdAt: new Date() }
    })) as Activity[];
  }

  async getActivitiesByPeriod(curatorId: number, startDate: Date, endDate: Date): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(and(
        eq(activities.curatorId, curatorId),
        sql`${activities.timestamp} >= ${startDate}`,
        sql`${activities.timestamp} <= ${endDate}`
      ))
      .orderBy(desc(activities.timestamp));
  }

  async getRecentActivities(limit = 50): Promise<(Activity & { curator: Curator, server: DiscordServer })[]> {
    const results = await db
      .select({
        id: activities.id,
        curatorId: activities.curatorId,
        serverId: activities.serverId,
        type: activities.type,
        channelId: activities.channelId,
        channelName: activities.channelName,
        messageId: activities.messageId,
        content: activities.content,
        reactionEmoji: activities.reactionEmoji,
        targetMessageId: activities.targetMessageId,
        targetMessageContent: activities.targetMessageContent,
        timestamp: activities.timestamp,
        curator: curators,
        server: discordServers,
      })
      .from(activities)
      .leftJoin(curators, eq(activities.curatorId, curators.id))
      .leftJoin(discordServers, eq(activities.serverId, discordServers.id))
      .orderBy(desc(activities.timestamp))
      .limit(limit);
      
    return results.filter(r => r.curator && r.server) as (Activity & { curator: Curator, server: DiscordServer })[];
  }

  async getActivitiesInDateRange(startDate: Date, endDate: Date): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(and(
        sql`${activities.timestamp} >= ${startDate}`,
        sql`${activities.timestamp} <= ${endDate}`
      ))
      .orderBy(desc(activities.timestamp));
  }

  async getActivitiesForServer(serverId: number): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.serverId, serverId))
      .orderBy(desc(activities.timestamp));
  }

  // Discord server methods
  async getDiscordServers(): Promise<DiscordServer[]> {
    return await db.select().from(discordServers).where(eq(discordServers.isActive, true));
  }

  async createDiscordServer(server: InsertDiscordServer): Promise<DiscordServer> {
    const [newServer] = await db
      .insert(discordServers)
      .values(server)
      .returning();
    return newServer;
  }

  async getServerByServerId(serverId: string): Promise<DiscordServer | undefined> {
    const [server] = await db.select().from(discordServers).where(eq(discordServers.serverId, serverId));
    return server || undefined;
  }

  async updateDiscordServer(id: number, server: Partial<InsertDiscordServer>): Promise<DiscordServer | undefined> {
    const [updated] = await db
      .update(discordServers)
      .set(server)
      .where(eq(discordServers.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteDiscordServer(id: number): Promise<boolean> {
    try {
      await db
        .delete(discordServers)
        .where(eq(discordServers.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting Discord server:', error);
      return false;
    }
  }

  // Response tracking methods
  async createResponseTracking(tracking: InsertResponseTracking): Promise<ResponseTracking> {
    const [newTracking] = await db
      .insert(responseTracking)
      .values(tracking)
      .returning();
    return newTracking;
  }

  async updateResponseTracking(id: number, tracking: Partial<InsertResponseTracking>): Promise<ResponseTracking | undefined> {
    const [updated] = await db
      .update(responseTracking)
      .set(tracking)
      .where(eq(responseTracking.id, id))
      .returning();
    return updated || undefined;
  }

  async getResponseTrackingByMention(mentionMessageId: string): Promise<ResponseTracking | undefined> {
    const [tracking] = await db
      .select()
      .from(responseTracking)
      .where(eq(responseTracking.mentionMessageId, mentionMessageId));
    return tracking || undefined;
  }

  async getUnrespondedMessages(): Promise<ResponseTracking[]> {
    const unresponded = await db
      .select()
      .from(responseTracking)
      .where(and(
        sql`${responseTracking.responseTimestamp} IS NULL`,
        sql`${responseTracking.curatorId} IS NULL`
      ))
      .orderBy(desc(responseTracking.mentionTimestamp));
    return unresponded;
  }

  async getCuratorAvgResponseTime(curatorId: number): Promise<number | null> {
    const result = await db
      .select({
        avgTime: sql<number>`AVG(${responseTracking.responseTimeSeconds})`
      })
      .from(responseTracking)
      .where(and(
        eq(responseTracking.curatorId, curatorId),
        sql`${responseTracking.responseTimeSeconds} IS NOT NULL`
      ));
    
    const avgTime = result[0]?.avgTime;
    console.log(`Curator ${curatorId} avg response time from DB:`, avgTime);
    return avgTime || null;
  }

  // Bot settings methods
  async getBotSettings(): Promise<Record<string, string>> {
    const settings = await db.select().from(botSettings);
    const settingsMap: Record<string, string> = {};
    for (const setting of settings) {
      settingsMap[setting.settingKey] = setting.settingValue;
    }
    return settingsMap;
  }

  async setBotSetting(key: string, value: string, description?: string): Promise<void> {
    await db
      .insert(botSettings)
      .values({
        settingKey: key,
        settingValue: value,
        description: description || '',
      })
      .onConflictDoUpdate({
        target: botSettings.settingKey,
        set: {
          settingValue: value,
          description: description || botSettings.description,
          updatedAt: sql`NOW()`,
        },
      });
  }

  async getBotSetting(key: string, defaultValue?: string): Promise<string | null> {
    const [setting] = await db
      .select()
      .from(botSettings)
      .where(eq(botSettings.settingKey, key));
    
    return setting?.settingValue || defaultValue || null;
  }

  // Rating settings methods
  async getRatingSettings(): Promise<RatingSettings[]> {
    const settings = await db.select().from(ratingSettings).orderBy(ratingSettings.minScore);
    if (settings.length === 0) {
      await this.initializeDefaultRatingSettings();
      return await db.select().from(ratingSettings).orderBy(ratingSettings.minScore);
    }
    return settings;
  }

  async createRatingSettings(settings: InsertRatingSettings): Promise<RatingSettings> {
    const [newSettings] = await db
      .insert(ratingSettings)
      .values(settings)
      .returning();
    return newSettings;
  }

  async updateRatingSettings(id: number, settings: Partial<InsertRatingSettings>): Promise<RatingSettings | undefined> {
    const [updated] = await db
      .update(ratingSettings)
      .set(settings)
      .where(eq(ratingSettings.id, id))
      .returning();
    return updated || undefined;
  }

  async getRatingByName(name: string): Promise<RatingSettings | undefined> {
    const [setting] = await db
      .select()
      .from(ratingSettings)
      .where(eq(ratingSettings.ratingName, name));
    return setting || undefined;
  }

  async initializeDefaultRatingSettings(): Promise<void> {
    const defaultSettings = [
      {
        ratingName: "excellent",
        ratingText: "Великолепно", 
        minScore: 50,
        color: "bg-green-500",
      },
      {
        ratingName: "good",
        ratingText: "Хорошо",
        minScore: 35,
        color: "bg-blue-500",
      },
      {
        ratingName: "normal",
        ratingText: "Нормально",
        minScore: 20,
        color: "bg-yellow-500",
      },
      {
        ratingName: "poor",
        ratingText: "Плохо",
        minScore: 10,
        color: "bg-orange-500",
      },
      {
        ratingName: "terrible",
        ratingText: "Ужасно",
        minScore: 0,
        color: "bg-red-500",
      }
    ];

    for (const setting of defaultSettings) {
      await db.insert(ratingSettings).values(setting).onConflictDoNothing();
    }
  }

  // Global rating config methods
  async getGlobalRatingConfig(): Promise<GlobalRatingConfig | undefined> {
    const [config] = await db.select().from(globalRatingConfig).limit(1);
    if (!config) {
      await this.initializeDefaultGlobalConfig();
      const [newConfig] = await db.select().from(globalRatingConfig).limit(1);
      return newConfig || undefined;
    }
    return config;
  }

  async updateGlobalRatingConfig(config: Partial<InsertGlobalRatingConfig>): Promise<GlobalRatingConfig | undefined> {
    const existingConfig = await this.getGlobalRatingConfig();
    if (existingConfig) {
      const [updated] = await db
        .update(globalRatingConfig)
        .set(config)
        .where(eq(globalRatingConfig.id, existingConfig.id))
        .returning();
      return updated || undefined;
    } else {
      const [created] = await db
        .insert(globalRatingConfig)
        .values(config as InsertGlobalRatingConfig)
        .returning();
      return created || undefined;
    }
  }

  async initializeDefaultGlobalConfig(): Promise<void> {
    const defaultConfig = {
      activityPointsMessage: 3,
      activityPointsReaction: 1,
      activityPointsReply: 2,
      activityPointsTaskVerification: 5,
      responseTimeGoodSeconds: 60,
      responseTimePoorSeconds: 300,
    };

    await db.insert(globalRatingConfig).values(defaultConfig).onConflictDoNothing();
  }

  // Statistics methods
  async getCuratorStats(curatorId?: number): Promise<any> {
    if (curatorId) {
      // Get specific curator stats
      const curatorActivities = await this.getActivitiesByCurator(curatorId, 1000);
      
      const totalActivities = curatorActivities.length;
      const messages = curatorActivities.filter(a => a.type === 'message').length;
      const reactions = curatorActivities.filter(a => a.type === 'reaction').length;
      const replies = curatorActivities.filter(a => a.type === 'reply').length;
      const score = messages * 3 + replies * 2 + reactions;
      
      // Calculate average response time using response tracking table
      let avgResponseTime = await this.getCuratorAvgResponseTime(curatorId);
      if (avgResponseTime) {
        avgResponseTime = Math.round(avgResponseTime);
      }
      
      return [{
        curatorId,
        totalActivities,
        totalMessages: messages,
        totalReactions: reactions,
        totalReplies: replies,
        messages,
        reactions,
        replies,
        score,
        avgResponseTime
      }];
    } else {
      // Get all curator stats
      const stats = await db
        .select({
          curatorId: activities.curatorId,
          totalMessages: sql<number>`count(case when ${activities.type} = 'message' then 1 end)`,
          totalReactions: sql<number>`count(case when ${activities.type} = 'reaction' then 1 end)`,
          totalReplies: sql<number>`count(case when ${activities.type} = 'reply' then 1 end)`,
        })
        .from(activities)
        .groupBy(activities.curatorId);

      return stats;
    }
  }

  async getDashboardStats(): Promise<any> {
    console.log("=== GET DASHBOARD STATS START ===");
    
    const [curators, allActivities, allServers] = await Promise.all([
      this.getCurators(),
      this.getRecentActivities(1000),
      this.getDiscordServers()
    ]);
    
    const today = new Date().toISOString().split('T')[0];
    const todayActivities = allActivities.filter(a => {
      if (!a.timestamp) return false;
      const activityDate = a.timestamp instanceof Date 
        ? a.timestamp.toISOString().split('T')[0] 
        : new Date(a.timestamp).toISOString().split('T')[0];
      return activityDate === today;
    });
    
    console.log("Today:", today);
    console.log("Total activities:", allActivities.length);
    console.log("Today activities:", todayActivities.length);
    console.log("Total servers:", allServers.length);
    
    // Calculate average response time using response tracking table
    console.log("Calculating global average response time from response tracking...");
    
    let avgResponseTime = 0;
    
    const responseStats = await db
      .select({
        avgTime: sql<number>`AVG(${responseTracking.responseTimeSeconds})`
      })
      .from(responseTracking)
      .where(and(
        sql`${responseTracking.responseTimeSeconds} IS NOT NULL`,
        sql`${responseTracking.curatorId} IS NOT NULL` // Only count responses that have actual curator assigned
      ));
    
    if (responseStats[0]?.avgTime) {
      avgResponseTime = Math.round(responseStats[0].avgTime);
      console.log(`Global average response time: ${avgResponseTime}s`);
    } else {
      console.log("No response time data found in tracking table");
    }

    const stats = {
      totalCurators: curators.filter(c => c.isActive).length,
      todayMessages: todayActivities.filter(a => a.type === 'message').length.toString(),
      todayReactions: todayActivities.filter(a => a.type === 'reaction').length.toString(),
      todayReplies: todayActivities.filter(a => a.type === 'reply').length.toString(),
      avgResponseTime: avgResponseTime.toString()
    };
    
    console.log("Final dashboard stats:", stats);
    return stats;
  }

  async getDailyActivityStats(days: number): Promise<any> {
    const dailyStats = await db
      .select({
        date: sql<string>`DATE(${activities.timestamp})`,
        messages: sql<number>`count(case when ${activities.type} = 'message' then 1 end)`,
        reactions: sql<number>`count(case when ${activities.type} = 'reaction' then 1 end)`,
        replies: sql<number>`count(case when ${activities.type} = 'reply' then 1 end)`,
        total: sql<number>`count(*)`
      })
      .from(activities)
      .where(sql`${activities.timestamp} >= NOW() - INTERVAL ${sql.raw(`'${days} days'`)}`)
      .groupBy(sql`DATE(${activities.timestamp})`)
      .orderBy(sql`DATE(${activities.timestamp}) DESC`);

    return dailyStats;
  }

  async getTopCurators(limit: number): Promise<any> {
    console.log("=== GET TOP CURATORS START ===");
    console.log("Limit:", limit);
    
    try {
      // Get all active curators
      console.log("About to call getCurators()...");
      const allCurators = await this.getCurators();
      console.log("Found curators:", allCurators.length);
      
      if (allCurators.length === 0) {
        console.log("No curators found - returning empty array");
        return [];
      }
      
      // console.log("Curators found:", allCurators.map(c => ({ id: c.id, name: c.name, isActive: c.isActive })));
      
      if (!allCurators || allCurators.length === 0) {
        console.log("No curators found");
        return [];
      }

      // Build stats for each curator
      const curatorsWithStats = [];
      
      for (const curator of allCurators) {
        if (!curator.isActive) continue;
        
        console.log(`Processing curator: ${curator.name}`);
        
        // Get activities for this curator
        console.log(`Getting activities for curator ID: ${curator.id}`);
        const curatorActivities = await this.getActivitiesByCurator(curator.id, 1000);
        console.log(`Found ${curatorActivities.length} activities for ${curator.name}`);
        
        const totalActivities = curatorActivities.length;
        const messages = curatorActivities.filter(a => a.type === 'message').length;
        const reactions = curatorActivities.filter(a => a.type === 'reaction').length;
        const replies = curatorActivities.filter(a => a.type === 'reply').length;
        const taskVerifications = curatorActivities.filter(a => a.type === 'task_verification').length;
        
        // Get dynamic scoring configuration
        const globalConfig = await this.getGlobalRatingConfig();
        const messagePoints = globalConfig?.activityPointsMessage || 3;
        const replyPoints = globalConfig?.activityPointsReply || 2;
        const reactionPoints = globalConfig?.activityPointsReaction || 1;
        const taskPoints = globalConfig?.activityPointsTaskVerification || 5;
        
        // Enhanced scoring with configurable points
        const score = messages * messagePoints + replies * replyPoints + reactions * reactionPoints + taskVerifications * taskPoints;
        
        // Calculate average response time using response tracking
        let avgResponseTime = await this.getCuratorAvgResponseTime(curator.id);
        if (avgResponseTime) {
          avgResponseTime = Math.round(avgResponseTime);
        }
        
        console.log(`${curator.name}: total=${totalActivities}, messages=${messages}, reactions=${reactions}, replies=${replies}, taskVerifications=${taskVerifications}, score=${score}, avgResponseTime=${avgResponseTime}s`);
        
        curatorsWithStats.push({
          id: curator.id,
          name: curator.name,
          factions: curator.factions || [],
          curatorType: curator.curatorType,
          totalActivities,
          messages,
          reactions,
          replies,
          taskVerifications,
          score,
          avgResponseTime
        });
      }
      
      // Sort by score and limit
      const topCurators = curatorsWithStats
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, limit);

      console.log("=== FINAL TOP CURATORS ===");
      console.log("Count:", topCurators.length);
      console.log("Data:", JSON.stringify(topCurators, null, 2));

      return topCurators;
        
    } catch (error: any) {
      console.error("=== ERROR IN GET TOP CURATORS ===");
      console.error("Error:", error);
      console.error("Stack:", error?.stack);
      return [];
    }
  }

  async getServerStats(): Promise<any> {
    try {
      const servers = await this.getDiscordServers();
      const serverStatsPromises = servers.map(async (server) => {
        // Get activities for this server
        const serverActivities = await db
          .select()
          .from(activities)
          .where(eq(activities.serverId, server.id));

        const totalActivities = serverActivities.length;
        const messages = serverActivities.filter(a => a.type === 'message').length;
        const reactions = serverActivities.filter(a => a.type === 'reaction').length;
        const replies = serverActivities.filter(a => a.type === 'reply').length;

        // Get average response time for this server - only for messages that were actually answered
        const serverResponseTime = await db
          .select({
            avgTime: sql<number>`AVG(${responseTracking.responseTimeSeconds})`
          })
          .from(responseTracking)
          .where(and(
            eq(responseTracking.serverId, server.id),
            sql`${responseTracking.responseTimeSeconds} IS NOT NULL`,
            sql`${responseTracking.curatorId} IS NOT NULL` // Only count responses that have actual curator assigned
          ));

        const avgResponseTime = serverResponseTime[0]?.avgTime 
          ? Math.round(serverResponseTime[0].avgTime) 
          : null;

        // Get top curators for this server (curators with most activities)
        const curatorStats = await db
          .select({
            curatorId: activities.curatorId,
            count: sql<number>`count(*)`
          })
          .from(activities)
          .where(eq(activities.serverId, server.id))
          .groupBy(activities.curatorId)
          .orderBy(sql`count(*) DESC`)
          .limit(3);

        // Get curator names
        const topCurators = await Promise.all(
          curatorStats.map(async (stat) => {
            const curator = await this.getCuratorById(stat.curatorId);
            return {
              name: curator?.name || 'Unknown',
              activities: stat.count,
              factions: curator?.factions || []
            };
          })
        );

        return {
          id: server.id,
          serverId: server.serverId,
          name: server.name,
          roleTagId: server.roleTagId,
          isActive: server.isActive,
          totalActivities,
          todayActivities: serverActivities.filter(a => {
            if (!a.timestamp) return false;
            const today = new Date().toISOString().split('T')[0];
            const activityDate = a.timestamp instanceof Date 
              ? a.timestamp.toISOString().split('T')[0] 
              : new Date(a.timestamp).toISOString().split('T')[0];
            return activityDate === today;
          }).length,
          messages,
          reactions,
          replies,
          avgResponseTime,
          connected: connectedServers.has(server.serverId),
          topCurators
        };
      });

      return await Promise.all(serverStatsPromises);
    } catch (error) {
      console.error('Error getting server stats:', error);
      return [];
    }
  }

  // Task report methods
  async createTaskReport(report: InsertTaskReport): Promise<TaskReport> {
    const [newReport] = await db
      .insert(taskReports)
      .values(report)
      .returning();
    return newReport;
  }

  async updateTaskReport(id: number, report: Partial<InsertTaskReport>): Promise<TaskReport | undefined> {
    const [updated] = await db
      .update(taskReports)
      .set(report)
      .where(eq(taskReports.id, id))
      .returning();
    return updated || undefined;
  }

  async getTaskReportByMessageId(messageId: string): Promise<TaskReport | undefined> {
    const [report] = await db
      .select()
      .from(taskReports)
      .where(eq(taskReports.messageId, messageId));
    return report || undefined;
  }

  async getTaskReportsForServer(serverId: number): Promise<TaskReport[]> {
    return await db
      .select()
      .from(taskReports)
      .where(eq(taskReports.serverId, serverId))
      .orderBy(desc(taskReports.submittedAt));
  }

  async getPendingTaskReports(): Promise<TaskReport[]> {
    return await db
      .select()
      .from(taskReports)
      .where(eq(taskReports.status, 'pending'))
      .orderBy(desc(taskReports.submittedAt));
  }

  async getTaskReportsByWeek(weekStart: Date): Promise<TaskReport[]> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    return await db
      .select()
      .from(taskReports)
      .where(and(
        sql`${taskReports.weekStart} >= ${weekStart.toISOString()}`,
        sql`${taskReports.weekStart} < ${weekEnd.toISOString()}`
      ))
      .orderBy(desc(taskReports.submittedAt));
  }

  async getCuratorTaskStats(curatorId: number): Promise<{
    totalChecked: number;
    totalApproved: number;
    averageApprovalRate: number;
  }> {
    const stats = await db
      .select({
        totalChecked: sql<number>`count(*)`,
        totalApproved: sql<number>`sum(${taskReports.approvedTasks})`,
        totalTasks: sql<number>`sum(${taskReports.taskCount})`
      })
      .from(taskReports)
      .where(and(
        eq(taskReports.curatorId, curatorId),
        sql`${taskReports.status} != 'pending'`
      ));

    const result = stats[0];
    if (!result || result.totalChecked === 0) {
      return {
        totalChecked: 0,
        totalApproved: 0,
        averageApprovalRate: 0
      };
    }

    const averageApprovalRate = result.totalTasks > 0 
      ? Math.round((result.totalApproved / result.totalTasks) * 100)
      : 0;

    return {
      totalChecked: result.totalChecked,
      totalApproved: result.totalApproved || 0,
      averageApprovalRate
    };
  }
}

export const storage = new DatabaseStorage();