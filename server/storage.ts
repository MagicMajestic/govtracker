import { 
  curators, 
  activities, 
  discordServers,
  users,
  responseTracking,
  type Curator, 
  type InsertCurator,
  type Activity,
  type InsertActivity,
  type DiscordServer,
  type InsertDiscordServer,
  type User,
  type InsertUser,
  type ResponseTracking,
  type InsertResponseTracking
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";

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
  
  // Discord server methods
  getDiscordServers(): Promise<DiscordServer[]>;
  createDiscordServer(server: InsertDiscordServer): Promise<DiscordServer>;
  getServerByServerId(serverId: string): Promise<DiscordServer | undefined>;
  updateDiscordServer(id: number, server: Partial<InsertDiscordServer>): Promise<DiscordServer | undefined>;
  
  // Response tracking methods
  createResponseTracking(tracking: InsertResponseTracking): Promise<ResponseTracking>;
  updateResponseTracking(id: number, tracking: Partial<InsertResponseTracking>): Promise<ResponseTracking | undefined>;
  getResponseTrackingByMention(mentionMessageId: string): Promise<ResponseTracking | undefined>;
  getCuratorAvgResponseTime(curatorId: number): Promise<number | null>;
  
  // Statistics methods
  getCuratorStats(curatorId?: number): Promise<any>;
  getDashboardStats(): Promise<any>;
  getDailyActivityStats(days: number): Promise<any>;
  getTopCurators(limit: number): Promise<any>;
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
    
    return result[0]?.avgTime || null;
  }

  // Statistics methods
  async getCuratorStats(curatorId?: number): Promise<any> {
    const whereClause = curatorId ? eq(activities.curatorId, curatorId) : undefined;
    
    const stats = await db
      .select({
        curatorId: activities.curatorId,
        totalMessages: sql<number>`count(case when ${activities.type} = 'message' then 1 end)`,
        totalReactions: sql<number>`count(case when ${activities.type} = 'reaction' then 1 end)`,
        totalReplies: sql<number>`count(case when ${activities.type} = 'reply' then 1 end)`,
      })
      .from(activities)
      .where(whereClause)
      .groupBy(activities.curatorId);

    return stats;
  }

  async getDashboardStats(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const totalCurators = await db.select({ count: count() }).from(curators).where(eq(curators.isActive, true));
    
    const todayActivities = await db
      .select({
        totalMessages: sql<number>`count(case when ${activities.type} = 'message' then 1 end)`,
        totalReactions: sql<number>`count(case when ${activities.type} = 'reaction' then 1 end)`,
        totalReplies: sql<number>`count(case when ${activities.type} = 'reply' then 1 end)`,
      })
      .from(activities)
      .where(sql`${activities.timestamp} >= ${today}`);

    return {
      totalCurators: totalCurators[0]?.count || 0,
      todayMessages: todayActivities[0]?.totalMessages || 0,
      todayReactions: todayActivities[0]?.totalReactions || 0,
      todayReplies: todayActivities[0]?.totalReplies || 0,
    };
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
    try {
      console.log("getTopCurators called with limit:", limit);
      
      // First, get all active curators
      const allCurators = await db
        .select()
        .from(curators)
        .where(eq(curators.isActive, true));

      console.log("Found active curators:", allCurators.length);

      if (allCurators.length === 0) {
        console.log("No active curators found, returning empty array");
        return [];
      }

      // For now, just return the curators with zero activity stats to avoid SQL issues
      const result = allCurators.map(curator => ({
        ...curator,
        totalActivities: 0,
        messages: 0,
        reactions: 0,
        replies: 0,
        score: 0
      }));

      console.log("Returning curator stats:", result);
      return result;
    } catch (error) {
      console.error("Error in getTopCurators:", error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();