import { Client, GatewayIntentBits, Events } from 'discord.js';
import { storage } from './storage';

const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN || "";
const CURATOR_NOTIFICATION_SERVER_ID = "805026457327108126";
const CURATOR_NOTIFICATION_CHANNEL_ID = "974783377465036861";
let NOTIFICATION_DELAY_MS = 20 * 1000; // Default 20 seconds for testing

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

// Map to track repeat notification intervals
const repeatNotificationIntervals = new Map();

// Map to track message creation timestamps for accurate time calculation
const messageStartTimes = new Map();

// Set to track connected servers
export const connectedServers = new Set<string>();

// Global reference to the Discord client
let discordClient: Client | null = null;

// Function to update connected servers list
export async function updateConnectedServers() {
  if (!discordClient) {
    console.log('Discord client not ready yet');
    return;
  }

  const servers = await storage.getDiscordServers();
  console.log(`🔄 Updating connected servers list (${servers.length} servers in database)`);
  
  connectedServers.clear();
  servers.forEach(server => {
    const guild = discordClient!.guilds.cache.get(server.serverId);
    const isConnected = !!guild;
    console.log(`- ${server.name} (${server.serverId}): ${isConnected ? 'Connected' : 'Not Found'}`);
    if (isConnected) {
      connectedServers.add(server.serverId);
    }
  });
  
  console.log(`✅ Connected servers updated: ${Array.from(connectedServers)}`);
}



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

  // Store client reference for later use
  discordClient = client;

  client.once(Events.ClientReady, async (readyClient) => {
    console.log(`Discord bot ready! Logged in as ${readyClient.user.tag}`);
    
    // Verify server connections and update connected servers set
    const servers = await storage.getDiscordServers();
    console.log(`Monitoring ${servers.length} Discord servers:`);
    connectedServers.clear(); // Clear previous connections
    servers.forEach(server => {
      const guild = client.guilds.cache.get(server.serverId);
      const isConnected = !!guild;
      console.log(`- ${server.name}: ${isConnected ? 'Connected' : 'Not Found'}`);
      if (isConnected) {
        connectedServers.add(server.serverId);
        
        // Check permissions for Test server specifically
        if ((server.name === 'Test' || server.name === 'TEST') && server.completedTasksChannelId) {
          const channel = guild.channels.cache.get(server.completedTasksChannelId);
          if (channel) {
            console.log(`✅ Found Test server completed-tasks channel: ${channel.name}`);
            const permissions = channel.permissionsFor(client.user!);
            console.log(`📝 Bot permissions in completed-tasks channel:
              - View Channel: ${permissions?.has('ViewChannel')}
              - Read Message History: ${permissions?.has('ReadMessageHistory')}
              - Send Messages: ${permissions?.has('SendMessages')}
              - Add Reactions: ${permissions?.has('AddReactions')}`);
          } else {
            console.log(`❌ Cannot find completed-tasks channel ${server.completedTasksChannelId} in Test server`);
          }
        }
      }
    });

    // Check notification server access
    console.log(`\n🔍 CHECKING NOTIFICATION SERVER ACCESS:`);
    const notificationServer = client.guilds.cache.get(CURATOR_NOTIFICATION_SERVER_ID);
    if (notificationServer) {
      console.log(`✅ Notification server found: ${notificationServer.name} (${notificationServer.id})`);
      
      const notificationChannel = notificationServer.channels.cache.get(CURATOR_NOTIFICATION_CHANNEL_ID);
      if (notificationChannel && notificationChannel.isTextBased()) {
        console.log(`✅ Notification channel found: ${notificationChannel.name} (${notificationChannel.id})`);
        console.log(`🔧 Bot permissions in notification channel:`, notificationChannel.permissionsFor(readyClient.user)?.toArray());
      } else {
        console.log(`❌ Notification channel NOT found or not text-based`);
        console.log(`Available channels:`, notificationServer.channels.cache.map(c => `${c.name} (${c.id})`).slice(0, 10));
      }
    } else {
      console.log(`❌ Notification server NOT found`);
      console.log(`Available servers:`, client.guilds.cache.map(g => `${g.name} (${g.id})`));
    }
    console.log(`📋 Current pending notifications:`, pendingNotifications.size);

    // Load notification delay from settings
    console.log(`\n⚙️ LOADING BOT SETTINGS:`);
    try {
      const notificationDelay = await storage.getBotSetting('notificationDelay', '20');
      NOTIFICATION_DELAY_MS = parseInt(notificationDelay || '20') * 1000;
      console.log(`✅ Notification delay set to: ${NOTIFICATION_DELAY_MS/1000} seconds (${NOTIFICATION_DELAY_MS/1000/60} minutes)`);
    } catch (error) {
      console.error('Error loading bot settings:', error);
      console.log(`📍 Using default notification delay: ${NOTIFICATION_DELAY_MS/1000} seconds`);
    }

    // Check for any unresponded messages in response_tracking and reschedule notifications
    console.log(`\n🔍 CHECKING FOR UNRESPONDED MESSAGES:`);
    try {
      const unrespondedMessages = await storage.getUnrespondedMessages();
      console.log(`Found ${unrespondedMessages.length} unresponded messages`);
      
      for (const tracking of unrespondedMessages) {
        const messageAge = Date.now() - new Date(tracking.mentionTimestamp).getTime();
        const server = await storage.getDiscordServers().then(servers => 
          servers.find(s => s.id === tracking.serverId)
        );
        
        if (server && messageAge < 5 * 60 * 1000) { // Only reschedule if less than 5 minutes old
          console.log(`📅 Rescheduling notification for message ${tracking.mentionMessageId} (age: ${Math.round(messageAge/1000)}s)`);
          
          const messageInfo = {
            guildId: server.serverId,
            channelId: 'unknown', // We don't have channel ID in response_tracking
            messageId: tracking.mentionMessageId
          };
          
          // Load current notification delay for rescheduling
          const currentDelay = await storage.getBotSetting('notificationDelay', '30');
          const currentDelayMs = parseInt(currentDelay || '30') * 1000;
          const remainingTime = Math.max(1000, currentDelayMs - messageAge);
          scheduleNotificationWithDelay(messageInfo, server.name, remainingTime);
        } else {
          // Load current notification delay for comparison
          const currentDelay = await storage.getBotSetting('notificationDelay', '30');
          const currentDelayMs = parseInt(currentDelay || '30') * 1000;
          if (messageAge >= currentDelayMs) {
            console.log(`⏰ Message ${tracking.mentionMessageId} is overdue (age: ${Math.round(messageAge/1000)}s), sending immediate notification`);
          }
          
          const messageInfo = {
            guildId: server?.serverId || 'unknown',
            channelId: 'unknown',
            messageId: tracking.mentionMessageId
          };
          
          if (server) {
            sendCuratorNotification(messageInfo, server.name, messageAge);
          }
        }
      }
    } catch (error) {
      console.error('Error checking unresponded messages:', error);
    }
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

    console.log(`🔔 [BOT] NEW MESSAGE EVENT: ${message.author.username} (${message.author.id}) in guild ${message.guildId}`);
    console.log(`📝 Message content: "${message.content}"`);
    console.log(`📍 Channel ID: ${message.channelId}`);
    console.log(`🆔 Message ID: ${message.id}`);
    console.log(`⏰ Timestamp: ${message.createdAt}`);

    try {
      // First, get server info
      const server = await storage.getServerByServerId(message.guildId!);
      if (!server) {
        console.log(`Server ${message.guildId} not found in database`);
        return;
      }

      // Check if author is a curator first
      const curator = await storage.getCuratorByDiscordId(message.author.id);
      
      // For Detectives server, always check for role mentions and keywords
      const containsRoleTag = server.roleTagId && message.content.includes(`<@&${server.roleTagId}>`);
      const containsKeywords = ['куратор', 'curator', 'помощь', 'help', 'вопрос', 'question'].some(word => 
        message.content.toLowerCase().includes(word)
      );
      
      // Check if this message needs curator response (from non-curator users OR even curators for testing)
      const needsCuratorResponse = (containsRoleTag || containsKeywords);

      console.log(`🔍 MESSAGE ANALYSIS:
        - Author: ${message.author.username} (${message.author.id})
        - Server: ${server.name} (${server.serverId})
        - From curator: ${curator ? curator.name : 'No'}
        - Server role tag ID: ${server.roleTagId || 'None'}
        - Contains role mention: ${containsRoleTag ? 'YES' : 'No'}
        - Contains keywords: ${containsKeywords ? 'YES' : 'No'}
        - Message content: "${message.content}"
        - Needs curator response: ${needsCuratorResponse ? 'YES' : 'No'}`);
      
      if (needsCuratorResponse) {
        console.log(`🚨 MESSAGE NEEDS CURATOR RESPONSE - creating response tracking record`);
        
        try {
          // Check if tracking already exists to prevent duplicates
          const existingTracking = await storage.getResponseTrackingByMention(message.id);
          if (existingTracking) {
            console.log(`⚠️ Response tracking already exists for message ${message.id}`);
          } else {
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
            
            // Store message creation time for accurate notification time calculation
            const notificationKey = `${message.guildId}_${message.id}`;
            messageStartTimes.set(notificationKey, message.createdAt.getTime());
            
            // Schedule curator notification
            const messageInfo = {
              guildId: message.guildId,
              channelId: message.channelId,
              messageId: message.id
            };
            scheduleCuratorNotification(messageInfo, server.name);
          }
        } catch (error) {
          console.error('Failed to create response tracking:', error);
        }
      }

      // Check if this is a completed-tasks channel first (for task submissions)
      const isCompletedTasksChannel = (message.channel && 'name' in message.channel && 
        message.channel.name?.toLowerCase().includes('completed-tasks')) ||
        (server.completedTasksChannelId && message.channelId === server.completedTasksChannelId);

      console.log(`🔍 COMPLETED TASKS CHANNEL CHECK:
        - Channel ID: ${message.channelId}
        - Server completed tasks channel: ${server.completedTasksChannelId}
        - Channel name: ${message.channel && 'name' in message.channel ? message.channel.name : 'Unknown'}
        - Is completed tasks channel: ${isCompletedTasksChannel}
        - Has reference (is reply): ${message.reference ? 'YES' : 'NO'}
        - Reference ID: ${message.reference?.messageId || 'None'}`);

      // Handle task submissions in completed-tasks channels (from non-curators AND curators in test server)
      if (isCompletedTasksChannel && !message.reference) {
        const isTestServer = server.name === 'Test Server' || server.name === 'Test' || server.name === 'TEST';
        console.log(`🔍 TASK CHANNEL CHECK:
          - Channel ID: ${message.channelId}
          - Server completed tasks channel: ${server.completedTasksChannelId}
          - Channel name: ${message.channel && 'name' in message.channel ? message.channel.name : 'Unknown'}
          - Is test server: ${isTestServer} (server name: ${server.name})
          - Author is curator: ${curator ? curator.name : 'No'}
          - Message content: "${message.content}"`);
        
        if (!curator || isTestServer) {
          await handleTaskSubmission(message, server, curator);
        } else {
          console.log(`⚠️ Non-test server curator ${curator.name} posted in completed-tasks - skipping task submission`);
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
          
          // Check if this is a completed-tasks channel (task verification)
          const isCompletedTasksChannel = (message.channel && 'name' in message.channel && 
            message.channel.name?.toLowerCase().includes('completed-tasks')) ||
            (server.completedTasksChannelId && message.channelId === server.completedTasksChannelId);

          // ENHANCED: Check if replying to message with curator mention/keywords
          const needsResponse = referencedMessage.content && (
            (server.roleTagId && referencedMessage.content.includes(`<@&${server.roleTagId}>`)) ||
            referencedMessage.content.toLowerCase().includes('куратор') ||
            referencedMessage.content.toLowerCase().includes('curator') ||
            referencedMessage.content.toLowerCase().includes('помощь') ||
            referencedMessage.content.toLowerCase().includes('help')
          );

          // Handle task verification in completed-tasks channels
          if (isCompletedTasksChannel && curator) {
            await handleTaskVerification(message, referencedMessage, server, curator);
          }

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

      // Check if this is a task verification reaction in completed-tasks channel
      const isCompletedTasksChannel = (reaction.message.channel && 
        'name' in reaction.message.channel && 
        reaction.message.channel.name?.toLowerCase().includes('completed-tasks')) ||
        (server.completedTasksChannelId && reaction.message.channelId === server.completedTasksChannelId);

      if (isCompletedTasksChannel) {
        await handleTaskReactionVerification(reaction, user, server, curator);
      }

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
  async function sendCuratorNotification(messageInfo: any, serverName: string, intervalMs?: number) {
    try {
      // Calculate actual time since message creation
      const notificationKey = `${messageInfo.guildId}_${messageInfo.messageId}`;
      const messageStartTime = messageStartTimes.get(notificationKey);
      const actualTimeWithoutResponse = messageStartTime ? (Date.now() - messageStartTime) : (intervalMs || 0);
      
      console.log(`🚨 ATTEMPTING TO SEND CURATOR NOTIFICATION:`, {
        serverName,
        actualTimeWithoutResponse: `${actualTimeWithoutResponse/1000}s`,
        intervalMs: intervalMs ? `${intervalMs/1000}s` : 'Not provided',
        guildId: messageInfo.guildId
      });

      // Special handling for Test Server - send notifications to itself (no @here mention)
      if (serverName === 'Test Server' || serverName === 'TEST') {
        console.log(`🧪 TEST SERVER NOTIFICATION: Sending to test server itself`);
        
        const testServer = client.guilds.cache.get(messageInfo.guildId);
        if (!testServer) {
          console.log(`❌ Test server ${messageInfo.guildId} not found`);
          return;
        }

        // Disable test server notifications to prevent spam
        console.log(`🔇 TEST SERVER NOTIFICATIONS DISABLED to prevent spam`);
        return;
      }

      // Get notification settings from database
      const notificationSettings = await storage.getNotificationSettings();
      let serverId = CURATOR_NOTIFICATION_SERVER_ID;
      let channelId = CURATOR_NOTIFICATION_CHANNEL_ID;
      
      if (notificationSettings) {
        serverId = notificationSettings.notificationServerId;
        channelId = notificationSettings.notificationChannelId;
        console.log(`📡 Using notification settings from database:`, {
          serverId,
          channelId
        });
      } else {
        console.log(`📡 Using default notification settings`);
      }

      // Normal handling for other servers
      const curatorServer = client.guilds.cache.get(serverId);
      if (!curatorServer) {
        console.log(`❌ Curator notification server ${serverId} not found`);
        console.log(`Available servers:`, client.guilds.cache.map(g => `${g.name} (${g.id})`));
        return;
      }

      console.log(`✅ Found curator server: ${curatorServer.name}`);

      // Find the specific notification channel
      const notificationChannel = curatorServer.channels.cache.get(channelId);

      if (!notificationChannel || !notificationChannel.isTextBased()) {
        console.log(`❌ Curator notification channel ${channelId} not found or not text-based`);
        console.log(`Available channels:`, curatorServer.channels.cache.map(c => `${c.name} (${c.id})`));
        return;
      }

      console.log(`✅ Found notification channel: ${notificationChannel.name}`);

      // Determine which curator role to mention based on server name (never @here for test server)
      let roleMention = "@here";
      for (const [roleName, roleId] of Object.entries(CURATOR_ROLES)) {
        if (serverName.toLowerCase().includes(roleName.toLowerCase()) || 
            serverName.toLowerCase().includes(roleName.toLowerCase().replace(' ', ''))) {
          roleMention = `<@&${roleId}>`;
          console.log(`✅ Found matching role for ${serverName}: ${roleName} -> ${roleId}`);
          break;
        }
      }

      const messageLink = `https://discord.com/channels/${messageInfo.guildId}/${messageInfo.channelId}/${messageInfo.messageId}`;
      const timeStr = actualTimeWithoutResponse >= 60000 ? Math.floor(actualTimeWithoutResponse / 60000) + ' мин' : Math.floor(actualTimeWithoutResponse / 1000) + ' сек';
      
      const notificationText = `${roleMention} ${messageLink} без ответа уже ${timeStr}.`;
      
      console.log(`📤 Sending notification:`, notificationText);
      
      await notificationChannel.send(notificationText);
      console.log(`✅ CURATOR NOTIFICATION SENT: ${serverName} (${roleMention}) - ${timeStr} without response`);
      
    } catch (error) {
      console.error('❌ Failed to send curator notification:', error);
    }
  }

  // Function to schedule curator notification with current settings
  async function scheduleCuratorNotification(messageInfo: any, serverName: string) {
    // Check if curator notifications are enabled
    try {
      const notificationsEnabled = await storage.getBotSetting('curatorNotificationEnabled', 'true');
      if (notificationsEnabled !== 'true') {
        console.log(`🔇 Curator notifications disabled - skipping notification for ${serverName}`);
        return;
      }
    } catch (error) {
      console.error('Error checking notification settings:', error);
    }

    // Load current notification delay from settings each time
    try {
      const currentDelay = await storage.getBotSetting('notificationDelay', '30');
      const currentDelayMs = parseInt(currentDelay || '30') * 1000;
      console.log(`📋 Using current notification delay: ${currentDelayMs/1000} seconds`);
      scheduleNotificationWithDelay(messageInfo, serverName, currentDelayMs);
    } catch (error) {
      console.error('Error loading current notification delay:', error);
      console.log(`📍 Falling back to cached delay: ${NOTIFICATION_DELAY_MS/1000} seconds`);
      scheduleNotificationWithDelay(messageInfo, serverName, NOTIFICATION_DELAY_MS);
    }
  }

  // Function to schedule curator notification with custom delay
  async function scheduleNotificationWithDelay(messageInfo: any, serverName: string, delayMs: number) {
    const notificationKey = `${messageInfo.guildId}_${messageInfo.messageId}`;
    
    console.log(`⏰ SCHEDULING CURATOR NOTIFICATION:`, {
      serverName,
      messageId: messageInfo.messageId,
      guildId: messageInfo.guildId,
      channelId: messageInfo.channelId,
      delaySeconds: delayMs / 1000,
      notificationKey
    });

    // Clear existing notification if any
    if (pendingNotifications.has(notificationKey)) {
      console.log(`🔄 Clearing existing notification for ${notificationKey}`);
      clearTimeout(pendingNotifications.get(notificationKey));
    }

    // Check if repeat notifications are enabled
    try {
      const repeatEnabled = await storage.getBotSetting('repeatNotifications', 'false');
      
      if (repeatEnabled === 'true') {
        console.log(`🔁 Repeat notifications enabled - setting up interval for ${notificationKey}`);
        
        // Clear existing repeat interval if any
        if (repeatNotificationIntervals.has(notificationKey)) {
          clearInterval(repeatNotificationIntervals.get(notificationKey));
        }
        
        // Send first notification after delay
        const timeoutId = setTimeout(async () => {
          console.log(`⏱️ FIRST REPEAT NOTIFICATION for ${notificationKey}`);
          await sendCuratorNotification(messageInfo, serverName);
          
          // Set up interval for repeat notifications
          const intervalId = setInterval(async () => {
            console.log(`🔁 REPEAT NOTIFICATION for ${notificationKey}`);
            await sendCuratorNotification(messageInfo, serverName);
          }, delayMs);
          
          repeatNotificationIntervals.set(notificationKey, intervalId);
          pendingNotifications.delete(notificationKey);
        }, delayMs);
        
        pendingNotifications.set(notificationKey, timeoutId);
      } else {
        // Single notification (original behavior)
        const timeoutId = setTimeout(async () => {
          console.log(`⏱️ SINGLE NOTIFICATION TIMEOUT TRIGGERED for ${notificationKey}`);
          await sendCuratorNotification(messageInfo, serverName);
          pendingNotifications.delete(notificationKey);
        }, delayMs);
        
        pendingNotifications.set(notificationKey, timeoutId);
      }
    } catch (error) {
      console.error('Error checking repeat notification settings:', error);
      // Fallback to single notification
      const timeoutId = setTimeout(async () => {
        console.log(`⏱️ FALLBACK NOTIFICATION TIMEOUT TRIGGERED for ${notificationKey}`);
        await sendCuratorNotification(messageInfo, serverName);
        pendingNotifications.delete(notificationKey);
      }, delayMs);
      
      pendingNotifications.set(notificationKey, timeoutId);
    }
    
    console.log(`✅ NOTIFICATION SCHEDULED: ${serverName} - will notify in ${delayMs/1000} seconds`);
    console.log(`📋 Pending notifications count: ${pendingNotifications.size}`);
  }

  // Function to cancel curator notification (when curator responds)
  function cancelCuratorNotification(messageId: string, guildId: string) {
    const notificationKey = `${guildId}_${messageId}`;
    
    // Cancel single notification
    if (pendingNotifications.has(notificationKey)) {
      clearTimeout(pendingNotifications.get(notificationKey));
      pendingNotifications.delete(notificationKey);
      console.log(`❌ SINGLE NOTIFICATION CANCELLED: Response received for ${messageId}`);
    }
    
    // Cancel repeat notification interval
    if (repeatNotificationIntervals.has(notificationKey)) {
      clearInterval(repeatNotificationIntervals.get(notificationKey));
      repeatNotificationIntervals.delete(notificationKey);
      console.log(`❌ REPEAT NOTIFICATIONS CANCELLED: Response received for ${messageId}`);
    }
    
    // Clean up message start time tracking
    messageStartTimes.delete(notificationKey);
  }



  // Handle task submission in completed-tasks channels
  async function handleTaskSubmission(message: any, server: any, curator: any) {
    try {
      console.log(`📋 TASK SUBMISSION: ${curator?.name || 'Non-curator'} posting in completed-tasks channel`);
      
      // Detectives server doesn't process task reports  
      if (server.name === 'Detectives') {
        console.log(`⚠️ Detectives server excluded from task reports`);
        return;
      }
      
      // Only faction leaders (non-curators) can submit tasks, EXCEPT in test server
      const isTestServer = server.name === 'Test Server' || server.name === 'Test' || server.name === 'TEST';
      console.log(`🔍 Server check: ${server.name} - isTestServer: ${isTestServer}, hasCurator: ${!!curator}`);
      if (curator && !isTestServer) {
        console.log(`⚠️ Non-test server curator ${curator.name} posted in completed-tasks - skipping task submission`);
        return;
      }

      // Extract task information from message content
      const content = message.content;
      const taskCount = extractTaskCount(content);
      
      console.log(`🔢 TASK COUNT EXTRACTION: "${content}" → ${taskCount} tasks`);
      
      if (taskCount === 0) {
        console.log(`⚠️ Could not extract task count from message: "${content}"`);
        console.log(`📝 Supported patterns: "5 задач", "10 заданий", "15 тасков", "20 tasks", или число от 1-50`);
        return;
      }

      // Determine week start (Monday of current week)
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
      weekStart.setHours(0, 0, 0, 0);

      // Create task report entry
      await storage.createTaskReport({
        serverId: server.id,
        authorId: message.author.id,
        authorName: message.author.username,
        messageId: message.id,
        channelId: message.channelId,
        content: content.substring(0, 1000),
        taskCount: taskCount,
        weekStart: weekStart,
        submittedAt: message.createdAt,
        status: 'pending',
        curatorId: null,
        checkedAt: null,
        approvedTasks: null
      });

      console.log(`✅ TASK REPORT CREATED: ${message.author.username} submitted ${taskCount} tasks for week ${weekStart.toISOString().split('T')[0]}`);
      
    } catch (error) {
      console.error('Error handling task submission:', error);
    }
  }

  // Handle task verification when curator replies to task report
  async function handleTaskVerification(message: any, referencedMessage: any, server: any, curator: any) {
    try {
      console.log(`📋 TASK VERIFICATION: ${curator.name} verifying task report ${referencedMessage.id}`);
      
      // Find existing task report
      const taskReport = await storage.getTaskReportByMessageId(referencedMessage.id);
      if (!taskReport) {
        console.log(`⚠️ No task report found for message ${referencedMessage.id}`);
        return;
      }

      if (taskReport.status !== 'pending') {
        console.log(`⚠️ Task report ${taskReport.id} already verified`);
        return;
      }

      // Extract approval count from curator message
      const approvedTasks = extractApprovalCount(message.content, taskReport.taskCount);
      
      // Update task report with curator verification
      await storage.updateTaskReport(taskReport.id, {
        curatorId: curator.id,
        curatorDiscordId: curator.discordId,
        curatorName: curator.name,
        checkedAt: message.createdAt,
        status: 'verified',
        approvedTasks: approvedTasks
      });

      console.log(`✅ TASK VERIFIED: ${curator.name} (${curator.factions?.[0]}) approved ${approvedTasks}/${taskReport.taskCount} tasks`);
      
      // Create special activity for task verification (higher score)
      await storage.createActivity({
        curatorId: curator.id,
        serverId: server.id,
        type: 'task_verification',
        channelId: message.channelId,
        channelName: message.channel && 'name' in message.channel ? message.channel.name : null,
        messageId: message.id,
        content: `Verified ${approvedTasks}/${taskReport.taskCount} tasks`,
        targetMessageId: referencedMessage.id,
        targetMessageContent: taskReport.content
      });

    } catch (error) {
      console.error('Error handling task verification:', error);
    }
  }

  // Handle task verification via reactions (emoji verdicts)
  async function handleTaskReactionVerification(reaction: any, user: any, server: any, curator: any) {
    try {
      console.log(`📋 TASK REACTION VERIFICATION: ${curator.name} reacting with ${reaction.emoji.name || reaction.emoji.toString()}`);
      
      const taskReport = await storage.getTaskReportByMessageId(reaction.message.id);
      if (!taskReport) {
        console.log(`⚠️ No task report found for message ${reaction.message.id}`);
        return;
      }

      if (taskReport.status !== 'pending') {
        console.log(`⚠️ Task report ${taskReport.id} already verified`);
        return;
      }

      // Map emojis to approval counts
      const emojiApprovals = getEmojiApprovalMapping(reaction.emoji.name || reaction.emoji.toString(), taskReport.taskCount);
      
      if (emojiApprovals === null) {
        console.log(`⚠️ Unknown verification emoji: ${reaction.emoji.name || reaction.emoji.toString()}`);
        return;
      }

      // Update task report with emoji verification
      await storage.updateTaskReport(taskReport.id, {
        curatorId: curator.id,
        curatorDiscordId: curator.discordId,
        curatorName: curator.name,
        checkedAt: new Date(),
        status: 'verified',
        approvedTasks: emojiApprovals
      });

      console.log(`✅ TASK VERIFIED VIA EMOJI: ${curator.name} (${curator.factions?.[0]}) approved ${emojiApprovals}/${taskReport.taskCount} tasks`);
      
      // Create special activity for emoji task verification
      await storage.createActivity({
        curatorId: curator.id,
        serverId: server.id,
        type: 'task_verification',
        channelId: reaction.message.channelId,
        channelName: reaction.message.channel && 'name' in reaction.message.channel ? reaction.message.channel.name : null,
        messageId: null,
        content: `Verified ${emojiApprovals}/${taskReport.taskCount} tasks via ${reaction.emoji.name || reaction.emoji.toString()}`,
        reactionEmoji: reaction.emoji.name || reaction.emoji.toString(),
        targetMessageId: reaction.message.id,
        targetMessageContent: taskReport.content
      });

    } catch (error) {
      console.error('Error handling task reaction verification:', error);
    }
  }

  // Helper function to extract task count from message content
  function extractTaskCount(content: string): number {
    // Look for patterns like "5 задач", "10 заданий", "15 тасков", etc.
    const patterns = [
      /(\d+)\s*задач/i,
      /(\d+)\s*заданий/i,
      /(\d+)\s*тасков/i,
      /(\d+)\s*task/i,
      /(\d+)\s*tasks/i,
      /задач[иа]?\s*(\d+)/i,
      /заданий?\s*(\d+)/i,
      /тасков?\s*(\d+)/i,
      /task[s]?\s*(\d+)/i
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    // Look for standalone numbers (risky but fallback)
    const numberMatch = content.match(/\b(\d{1,2})\b/);
    if (numberMatch && parseInt(numberMatch[1]) >= 1 && parseInt(numberMatch[1]) <= 50) {
      return parseInt(numberMatch[1]);
    }

    return 0;
  }

  // Helper function to extract approval count from curator message
  function extractApprovalCount(content: string, totalTasks: number): number {
    // Look for patterns like "одобрено 5", "5 одобрено", "5/10", "5 из 10", etc.
    const patterns = [
      /одобрено\s*(\d+)/i,
      /(\d+)\s*одобрено/i,
      /(\d+)\/\d+/,
      /(\d+)\s*из\s*\d+/i,
      /approved\s*(\d+)/i,
      /(\d+)\s*approved/i,
      /(\d+)\s*ok/i,
      /ok\s*(\d+)/i,
      /(\d+)\s*✅/,
      /✅\s*(\d+)/
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        const count = parseInt(match[1]);
        return Math.min(count, totalTasks); // Don't exceed total tasks
      }
    }

    // If curator says "все" or "all" - approve all tasks
    if (/\b(все|all|всё)\b/i.test(content)) {
      return totalTasks;
    }

    // If curator says "нет" or "no" - approve none
    if (/\b(нет|no|none|ничего)\b/i.test(content)) {
      return 0;
    }

    // Default: approve all tasks if no specific count found
    return totalTasks;
  }

  // Helper function to map emojis to approval counts
  function getEmojiApprovalMapping(emoji: string, totalTasks: number): number | null {
    const emojiMap: Record<string, (total: number) => number> = {
      '✅': (total) => total, // All approved
      '❌': () => 0, // None approved  
      '⭐': (total) => total, // All approved (excellent)
      '👍': (total) => total, // All approved
      '👎': () => 0, // None approved
      '🔥': (total) => total, // All approved (excellent)
      '💯': (total) => total, // All approved (perfect)
      '❓': (total) => Math.floor(total / 2), // Half approved (questionable)
      '⚠️': (total) => Math.floor(total / 2), // Half approved (warning)
      '🚫': () => 0, // None approved
      '🎯': (total) => total, // All approved (on target)
      '🏆': (total) => total, // All approved (champion)
      // Number emojis for specific counts
      '1️⃣': () => 1,
      '2️⃣': () => 2,
      '3️⃣': () => 3,
      '4️⃣': () => 4,
      '5️⃣': () => 5,
      '6️⃣': () => 6,
      '7️⃣': () => 7,
      '8️⃣': () => 8,
      '9️⃣': () => 9,
      '🔟': () => 10
    };

    const handler = emojiMap[emoji];
    if (handler) {
      return Math.min(handler(totalTasks), totalTasks);
    }

    return null; // Unknown emoji
  }

  client.on(Events.Error, (error) => {
    console.error('Discord client error:', error);
  });

  client.login(DISCORD_TOKEN).catch(console.error);
}

