import { Client, GatewayIntentBits, Events } from 'discord.js';
import { storage } from './storage';

const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN || "";
const CURATOR_NOTIFICATION_SERVER_ID = "805026457327108126";
const CURATOR_NOTIFICATION_CHANNEL_ID = "974783377465036861";
const NOTIFICATION_DELAY_MS = 5 * 60 * 1000; // 5 minutes

// Map server names to Discord role IDs for curator notifications
const CURATOR_ROLES: Record<string, string> = {
  'Detectives': '916616528395378708',
  'Weazel News': '1329213276587950080', 
  'EMS': '1329212940540313644',
  'LSCSD': '1329213185579946106',
  'SANG': '1329213239996973116',
  'LSPD': '1329212725921976322',
  'FIB': '1329213307059437629',
  'Government': '1329213001814773780'
};

// Map to track pending notifications
const pendingNotifications = new Map();

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
          // Create response tracking without curator ID - will be set when curator actually responds
          await storage.createResponseTracking({
            serverId: server.id,
            curatorId: null, // Will be set when actual curator responds
            mentionMessageId: message.id,
            mentionTimestamp: message.createdAt,
            responseMessageId: null,
            responseTimestamp: null,
            responseType: null,
            responseTimeSeconds: null
          });
          console.log(`✅ NEW RESPONSE TRACKING: Created record for message ${message.id} awaiting curator response (server: ${server.name})`);
          
          // Schedule curator notification
          const messageInfo = {
            guildId: message.guildId,
            channelId: message.channelId,
            messageId: message.id
          };
          scheduleCuratorNotification(messageInfo, server.name);
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
            console.log(`🚀 CURATOR REPLY TO MENTION: ${curator.name} replying to message with curator mention/keywords`);
            
            // Check if there's existing tracking for this message (from when original message was posted)
            const existingTracking = await storage.getResponseTrackingByMention(referencedMessage.id);
            if (existingTracking && !existingTracking.responseTimestamp) {
              // Update existing tracking record with curator response
              const responseTimeMs = message.createdAt.getTime() - new Date(existingTracking.mentionTimestamp).getTime();
              const responseTimeSeconds = Math.max(1, Math.round(responseTimeMs / 1000));
              
              await storage.updateResponseTracking(existingTracking.id, {
                curatorId: curator.id,
                responseMessageId: message.id,
                responseTimestamp: message.createdAt,
                responseType: 'reply',
                responseTimeSeconds: responseTimeSeconds
              });
              console.log(`✅ RESPONSE TRACKED: ${curator.name} responded in ${responseTimeSeconds}s with reply`);
              
              // Cancel any pending curator notification for this message
              cancelCuratorNotification(referencedMessage.id, message.guildId!);
            } else if (!existingTracking) {
              console.log(`No existing tracking found for message ${referencedMessage.id} - message may not have required curator response originally`);
            } else {
              console.log(`Message ${referencedMessage.id} already has a response from another curator`);
            }
          }
          
          // This logic is now handled above in the needsResponse block
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
        console.log(`🚀 CURATOR REACTION TO MENTION: ${curator.name} reacting to message with curator mention/keywords`);
        
        // Check if there's existing tracking for this message (from when original message was posted)
        const existingTracking = await storage.getResponseTrackingByMention(originalMessage.id);
        
        if (existingTracking && !existingTracking.responseTimestamp) {
          // Update existing tracking record with curator reaction
          const responseTimeMs = Date.now() - new Date(existingTracking.mentionTimestamp).getTime();
          const responseTimeSeconds = Math.max(1, Math.round(responseTimeMs / 1000));
          
          await storage.updateResponseTracking(existingTracking.id, {
            curatorId: curator.id,
            responseMessageId: `reaction_${reaction.message.id}_${user.id}`,
            responseTimestamp: new Date(),
            responseType: 'reaction',
            responseTimeSeconds: responseTimeSeconds
          });
          console.log(`✅ RESPONSE TRACKED: ${curator.name} responded in ${responseTimeSeconds}s with reaction`);
          
          // Cancel any pending curator notification for this message
          cancelCuratorNotification(originalMessage.id, reaction.message.guildId!);
        } else if (!existingTracking) {
          console.log(`No existing tracking found for message ${originalMessage.id} - message may not have required curator response originally`);
        } else {
          console.log(`Message ${originalMessage.id} already has a response from another curator`);
        }
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

  // Function to send notification to curator server
  async function sendCuratorNotification(messageInfo: any, serverName: string, timeWithoutResponse: number) {
    try {
      const curatorServer = client.guilds.cache.get(CURATOR_NOTIFICATION_SERVER_ID);
      if (!curatorServer) {
        console.log(`Curator notification server ${CURATOR_NOTIFICATION_SERVER_ID} not found`);
        return;
      }

      // Find the specific notification channel
      const notificationChannel = curatorServer.channels.cache.get(CURATOR_NOTIFICATION_CHANNEL_ID);

      if (!notificationChannel || !notificationChannel.isTextBased()) {
        console.log(`Curator notification channel ${CURATOR_NOTIFICATION_CHANNEL_ID} not found or not text-based`);
        return;
      }

      // Determine which curator role to mention based on server name
      let roleMention = "@here";
      for (const [roleName, roleId] of Object.entries(CURATOR_ROLES)) {
        if (serverName.toLowerCase().includes(roleName.toLowerCase()) || 
            serverName.toLowerCase().includes(roleName.toLowerCase().replace(' ', ''))) {
          roleMention = `<@&${roleId}>`;
          break;
        }
      }

      const messageLink = `https://discord.com/channels/${messageInfo.guildId}/${messageInfo.channelId}/${messageInfo.messageId}`;
      const timeStr = Math.floor(timeWithoutResponse / 60) + ' мин';
      
      const notificationText = `${roleMention} ${messageLink} без ответа уже ${timeStr}.`;
      
      await notificationChannel.send(notificationText);
      console.log(`✅ CURATOR NOTIFICATION SENT: ${serverName} (${roleMention}) - ${timeStr} without response`);
      
    } catch (error) {
      console.error('Failed to send curator notification:', error);
    }
  }

  // Function to schedule curator notification
  function scheduleCuratorNotification(messageInfo: any, serverName: string) {
    const notificationKey = `${messageInfo.guildId}_${messageInfo.messageId}`;
    
    // Clear existing notification if any
    if (pendingNotifications.has(notificationKey)) {
      clearTimeout(pendingNotifications.get(notificationKey));
    }
    
    // Schedule new notification
    const timeoutId = setTimeout(() => {
      sendCuratorNotification(messageInfo, serverName, NOTIFICATION_DELAY_MS);
      pendingNotifications.delete(notificationKey);
    }, NOTIFICATION_DELAY_MS);
    
    pendingNotifications.set(notificationKey, timeoutId);
    console.log(`⏰ NOTIFICATION SCHEDULED: ${serverName} - will notify in ${NOTIFICATION_DELAY_MS/1000/60} minutes`);
  }

  // Function to cancel curator notification (when curator responds)
  function cancelCuratorNotification(messageId: string, guildId: string) {
    const notificationKey = `${guildId}_${messageId}`;
    
    if (pendingNotifications.has(notificationKey)) {
      clearTimeout(pendingNotifications.get(notificationKey));
      pendingNotifications.delete(notificationKey);
      console.log(`❌ NOTIFICATION CANCELLED: Response received for ${messageId}`);
    }
  }

  client.on(Events.Error, (error) => {
    console.error('Discord client error:', error);
  });

  client.login(DISCORD_TOKEN).catch(console.error);
}