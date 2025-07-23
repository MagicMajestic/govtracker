import { Client, GatewayIntentBits, Events } from 'discord.js';
import { storage } from './storage';

const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;

export function startDiscordBot() {
  if (!DISCORD_TOKEN) {
    console.error('DISCORD_BOT_TOKEN environment variable is required');
    return;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.once(Events.ClientReady, async (readyClient) => {
    console.log(`Discord bot ready! Logged in as ${readyClient.user.tag}`);
    
    // Verify server connections
    const servers = await storage.getDiscordServers();
    console.log(`Monitoring ${servers.length} Discord servers:`);
    servers.forEach(server => {
      const guild = client.guilds.cache.get(server.serverId);
      console.log(`- ${server.name}: ${guild ? 'Connected' : 'Not Found'}`);
    });
  });

  // Add global error handler
  client.on(Events.Error, error => {
    console.error('Discord client error:', error);
  });

  // Add warning handler  
  client.on(Events.Warn, warning => {
    console.warn('Discord client warning:', warning);
  });

  // Add debug handler
  client.on(Events.Debug, info => {
    if (info.includes('Heartbeat') || info.includes('Session')) {
      console.log(`[Discord] ${info}`);
    }
  });

  // Monitor new messages
  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    console.log(`[BOT] Message received from ${message.author.username} (${message.author.id}) in guild ${message.guildId}`);

    try {
      // First, get server info
      const server = await storage.getServerByServerId(message.guildId!);
      if (!server) {
        console.log(`Server ${message.guildId} not found in database`);
        return;
      }

      // Check if author is a curator first
      const curator = await storage.getCuratorByDiscordId(message.author.id);
      
      // Check if this message needs curator response (from non-curator users)
      const needsCuratorResponse = !curator && (
        (server.roleTagId && message.content.includes(`<@&${server.roleTagId}>`)) ||
        message.content.toLowerCase().includes('куратор') ||
        message.content.toLowerCase().includes('curator') ||
        message.content.toLowerCase().includes('помощь') ||
        message.content.toLowerCase().includes('help') ||
        message.content.toLowerCase().includes('вопрос') ||
        message.content.toLowerCase().includes('question')
      );
      
      if (needsCuratorResponse) {
        console.log(`Message needs curator response - creating response tracking record`);
        
        try {
          await storage.createResponseTracking({
            serverId: server.id,
            curatorId: 0, // Will be updated when curator responds
            mentionMessageId: message.id,
            mentionTimestamp: message.createdAt,
            responseMessageId: null,
            responseTimestamp: null,
            responseType: null,
            responseTimeSeconds: null
          });
          console.log(`Response tracking record created for message ${message.id}`);
        } catch (error) {
          console.error('Failed to create response tracking:', error);
        }
      }

      // Process curator activities
      if (!curator) {
        console.log(`User ${message.author.username} is not a curator`);
        return;
      }

      console.log(`Found curator: ${curator.name} (${curator.curatorType})`);
      console.log(`Found server: ${server.name}`);

      const isReply = message.reference?.messageId;
      let targetMessageContent = null;

      if (isReply) {
        try {
          const referencedMessage = await message.fetchReference();
          targetMessageContent = referencedMessage.content.substring(0, 500); // Limit length
          
          // Check if this is a response to a tracked mention
          const tracking = await storage.getResponseTrackingByMention(message.reference?.messageId || '');
          if (tracking && !tracking.responseMessageId) {
            const responseTimeMs = message.createdAt.getTime() - new Date(tracking.mentionTimestamp).getTime();
            await storage.updateResponseTracking(tracking.id, {
              curatorId: curator.id,
              responseMessageId: message.id,
              responseTimestamp: message.createdAt,
              responseType: 'reply',
              responseTimeSeconds: Math.round(responseTimeMs / 1000)
            });
            console.log(`Updated response tracking: ${Math.round(responseTimeMs / 1000)}s response time`);
          }
        } catch (error) {
          console.error('Failed to fetch referenced message:', error);
        }
      }

      console.log(`Creating activity for curator ${curator.name} in server ${server.name}`);
      
      await storage.createActivity({
        curatorId: curator.id,
        serverId: server.id,
        type: isReply ? 'reply' : 'message',
        channelId: message.channelId,
        channelName: message.channel && 'name' in message.channel ? message.channel.name : null,
        messageId: message.id,
        content: message.content.substring(0, 1000), // Limit content length
        targetMessageId: isReply ? message.reference!.messageId : null,
        targetMessageContent,
      });

      console.log(`Activity created successfully!`);
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  // Monitor reactions - IMPROVED to track response times
  client.on(Events.MessageReactionAdd, async (reaction, user) => {
    if (user.bot) return;

    console.log(`Reaction received from ${user.username} (${user.id}) in guild ${reaction.message.guildId}`);

    try {
      const curator = await storage.getCuratorByDiscordId(user.id);
      if (!curator) {
        console.log(`User ${user.username} is not a curator`);
        return;
      }

      console.log(`Found curator: ${curator.name}`);

      const server = await storage.getServerByServerId(reaction.message.guildId!);
      if (!server) {
        console.log(`Server ${reaction.message.guildId} not found in database`);
        return;
      }

      console.log(`Found server: ${server.name}`);

      // Check if this reaction is a response to a tracked mention
      const tracking = await storage.getResponseTrackingByMention(reaction.message.id);
      if (tracking && !tracking.responseMessageId) {
        const responseTimeMs = Date.now() - new Date(tracking.mentionTimestamp).getTime();
        await storage.updateResponseTracking(tracking.id, {
          curatorId: curator.id,
          responseMessageId: null, // Reactions don't have message IDs
          responseTimestamp: new Date(),
          responseType: 'reaction',
          responseTimeSeconds: Math.round(responseTimeMs / 1000)
        });
        console.log(`Updated response tracking for reaction: ${Math.round(responseTimeMs / 1000)}s response time`);
      }

      let targetMessageContent = null;
      try {
        if (reaction.message.partial) {
          await reaction.message.fetch();
        }
        targetMessageContent = reaction.message.content?.substring(0, 500) || null;
      } catch (error) {
        console.error('Failed to fetch message for reaction:', error);
      }

      await storage.createActivity({
        curatorId: curator.id,
        serverId: server.id,
        type: 'reaction',
        channelId: reaction.message.channelId,
        channelName: reaction.message.channel && 'name' in reaction.message.channel ? reaction.message.channel.name : null,
        messageId: null,
        content: null,
        reactionEmoji: reaction.emoji.name || reaction.emoji.toString(),
        targetMessageId: reaction.message.id,
        targetMessageContent,
      });

      console.log(`Reaction activity created successfully!`);
    } catch (error) {
      console.error('Error processing reaction:', error);
    }
  });

  client.on(Events.Error, (error) => {
    console.error('Discord client error:', error);
  });

  client.login(DISCORD_TOKEN).catch(console.error);
}