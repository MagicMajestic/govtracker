import { 
  curators, 
  activities, 
  discordServers,
  users,
  type Curator, 
  type InsertCurator,
  type Activity,
  type InsertActivity,
  type DiscordServer,
  type InsertDiscordServer,
  type User,
  type InsertUser
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
  getCuratorsByType(curatorType: 'government' | 'crime'): Promise<Curator[]>;
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
  
  // Statistics methods
  getCuratorStats(curatorId?: number): Promise<any>;
  getDashboardStats(): Promise<any>;
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

  async getCuratorsByType(curatorType: 'government' | 'crime'): Promise<Curator[]> {
    return await db.select().from(curators).where(and(eq(curators.isActive, true), eq(curators.curatorType, curatorType)));
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
    return await db
      .select()
      .from(activities)
      .where(eq(activities.curatorId, curatorId))
      .orderBy(desc(activities.timestamp))
      .limit(limit);
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
}

export const storage = new DatabaseStorage();
