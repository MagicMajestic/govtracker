import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Discord servers configuration
export const discordServers = pgTable("discord_servers", {
  id: serial("id").primaryKey(),
  serverId: text("server_id").notNull().unique(),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true),
});

// Curators table
export const curators = pgTable("curators", {
  id: serial("id").primaryKey(),
  discordId: text("discord_id").notNull().unique(),
  name: text("name").notNull(),
  factions: text("factions").array().notNull(), // Multiple factions
  curatorType: text("curator_type").notNull(), // 'government' or 'crime'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity types: message, reaction, reply
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  curatorId: integer("curator_id").notNull(),
  serverId: integer("server_id").notNull(),
  type: text("type").notNull(), // 'message', 'reaction', 'reply'
  channelId: text("channel_id").notNull(),
  channelName: text("channel_name"),
  messageId: text("message_id"),
  content: text("content"),
  reactionEmoji: text("reaction_emoji"),
  targetMessageId: text("target_message_id"), // for reactions and replies
  targetMessageContent: text("target_message_content"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Relations
export const curatorsRelations = relations(curators, ({ many }) => ({
  activities: many(activities),
}));

export const discordServersRelations = relations(discordServers, ({ many }) => ({
  activities: many(activities),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  curator: one(curators, {
    fields: [activities.curatorId],
    references: [curators.id],
  }),
  server: one(discordServers, {
    fields: [activities.serverId],
    references: [discordServers.id],
  }),
}));

// Schemas
export const insertCuratorSchema = createInsertSchema(curators).pick({
  discordId: true,
  name: true,
  factions: true,
  curatorType: true,
}).extend({
  factions: z.array(z.string()),
  curatorType: z.enum(['government', 'crime']),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true,
});

export const insertDiscordServerSchema = createInsertSchema(discordServers).pick({
  serverId: true,
  name: true,
});

// Types
export type Curator = typeof curators.$inferSelect;
export type InsertCurator = z.infer<typeof insertCuratorSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type DiscordServer = typeof discordServers.$inferSelect;
export type InsertDiscordServer = z.infer<typeof insertDiscordServerSchema>;

// Users table (keeping original structure)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
