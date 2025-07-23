import { Client, GatewayIntentBits, Events } from 'discord.js';
import { storage } from './storage';

const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN || "";

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

      console.log(`Message analysis:
        - From curator: ${curator ? curator.name : 'No'}
        - Server has role tag: ${server.roleTagId ? 'Yes' : 'No'}
        - Contains role mention: ${server.roleTagId && message.content.includes(`<@&${server.roleTagId}>`) ? 'Yes' : 'No'}
        - Contains keywords: ${['куратор', 'curator', 'помощь', 'help', 'вопрос', 'question'].some(word => message.content.toLowerCase().includes(word))}
        - Needs curator response: ${needsCuratorResponse}`);
      
      if (needsCuratorResponse) {
        console.log(`Message needs curator response - creating response tracking record`);
        
        try {
          // Find any available curator for this server - we'll update with actual curator when they respond
          const serverCurators = await storage.getCurators();
          const availableCurator = serverCurators.find(c => c.isActive);
          
          if (availableCurator) {
            await storage.createResponseTracking({
              serverId: server.id,
              curatorId: availableCurator.id, // Placeholder, will be updated when actual curator responds
              mentionMessageId: message.id,
              mentionTimestamp: message.createdAt,
              responseMessageId: null,
              responseTimestamp: null,
              responseType: null,
              responseTimeSeconds: null
            });
            console.log(`✅ NEW RESPONSE TRACKING: Created record for message ${message.id} awaiting curator response (server: ${server.name})`);
          }
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
          
          // ENHANCED: Check if replying to message with curator mention/keywords
          const needsResponse = referencedMessage.content && (
            (server.roleTagId && referencedMessage.content.includes(`<@&${server.roleTagId}>`)) ||
            referencedMessage.content.toLowerCase().includes('куратор') ||
            referencedMessage.content.toLowerCase().includes('curator') ||
            referencedMessage.content.toLowerCase().includes('помощь') ||
            referencedMessage.content.toLowerCase().includes('help')
          );

          if (needsResponse) {
            console.log(`🚀 REAL-TIME RESPONSE: Checking for existing tracking or creating new one for reply by ${curator.name}`);
            
            // Only create tracking if there's no existing tracking for this message
            const existingTracking = await storage.getResponseTrackingByMention(referencedMessage.id);
            if (!existingTracking) {
              // Create realistic response time based on when user might have seen the message
              const estimatedViewTime = new Date(referencedMessage.createdTimestamp);
              const responseTimeMs = message.createdAt.getTime() - estimatedViewTime.getTime();
              const responseTimeSeconds = Math.max(1, Math.round(responseTimeMs / 1000)); // At least 1 second
              
              try {
                await storage.createResponseTracking({
                  serverId: server.id,
                  curatorId: curator.id,
                  mentionMessageId: referencedMessage.id,
                  mentionTimestamp: estimatedViewTime,
                  responseMessageId: message.id,
                  responseTimestamp: message.createdAt,
                  responseType: 'reply',
                  responseTimeSeconds: responseTimeSeconds
                });
                console.log(`✅ NEW RESPONSE TRACKED: ${curator.name} responded in ${responseTimeSeconds}s with reply`);
              } catch (error) {
                console.error('Failed to create new response tracking:', error);
              }
            }
          }
          
          // Check if this is a response to a tracked mention
          const tracking = await storage.getResponseTrackingByMention(message.reference?.messageId || '');
          if (tracking && !tracking.responseTimestamp) {
            const responseTimeMs = message.createdAt.getTime() - new Date(tracking.mentionTimestamp).getTime();
            const responseTimeSeconds = Math.round(responseTimeMs / 1000);
            
            await storage.updateResponseTracking(tracking.id, {
              curatorId: curator.id,
              responseMessageId: message.id,
              responseTimestamp: message.createdAt,
              responseType: 'reply',
              responseTimeSeconds: responseTimeSeconds
            });
            console.log(`✅ EXISTING RESPONSE TRACKED: ${curator.name} responded in ${responseTimeSeconds}s with reply`);
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

      // ENHANCED: Check if this reaction is a response to a message with curator mention 
      const originalMessage = reaction.message;
      
      // Check if original message contains curator role mention or keywords
      const needsResponse = originalMessage.content && (
        (server.roleTagId && originalMessage.content.includes(`<@&${server.roleTagId}>`)) ||
        originalMessage.content.toLowerCase().includes('куратор') ||
        originalMessage.content.toLowerCase().includes('curator') ||
        originalMessage.content.toLowerCase().includes('помощь') ||
        originalMessage.content.toLowerCase().includes('help')
      );

      if (needsResponse) {
        console.log(`🚀 REAL-TIME RESPONSE: Checking for existing tracking or creating new one for reaction by ${curator.name}`);
        
        // Only create tracking if there's no existing tracking for this message
        const existingTracking = await storage.getResponseTrackingByMention(originalMessage.id);
        if (!existingTracking) {
          // Create realistic response time based on message creation time
          const messageTimestamp = originalMessage.createdAt || new Date(originalMessage.createdTimestamp);
          const responseTimeMs = Date.now() - messageTimestamp.getTime();
          const responseTimeSeconds = Math.max(1, Math.round(responseTimeMs / 1000)); // At least 1 second
          
          try {
            await storage.createResponseTracking({
              serverId: server.id,
              curatorId: curator.id,
              mentionMessageId: originalMessage.id,
              mentionTimestamp: messageTimestamp,
              responseMessageId: `reaction_${originalMessage.id}`,
              responseTimestamp: new Date(),
              responseType: 'reaction',
              responseTimeSeconds: responseTimeSeconds
            });
            console.log(`✅ NEW RESPONSE TRACKED: ${curator.name} responded in ${responseTimeSeconds}s with reaction`);
          } catch (error) {
            console.error('Failed to create new response tracking:', error);
          }
        }
      }

      // Also check existing tracking
      const tracking = await storage.getResponseTrackingByMention(reaction.message.id);
      if (tracking && !tracking.responseTimestamp) {
        const responseTimeMs = Date.now() - new Date(tracking.mentionTimestamp).getTime();
        const responseTimeSeconds = Math.round(responseTimeMs / 1000);
        
        await storage.updateResponseTracking(tracking.id, {
          curatorId: curator.id,
          responseMessageId: `reaction_${reaction.message.id}`,
          responseTimestamp: new Date(),
          responseType: 'reaction',
          responseTimeSeconds: responseTimeSeconds
        });
        console.log(`✅ EXISTING RESPONSE TRACKED: ${curator.name} responded in ${responseTimeSeconds}s with reaction`);
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