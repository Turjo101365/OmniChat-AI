const axios = require('axios');
const config = require('../../config/env');
const { parseBotpressResponse, sanitizeErrorMessage } = require('../../utils/responseParser');

class BotpressProvider {
  constructor() {
    this.name = 'botpress';
    this.baseUrl = 'https://api.botpress.cloud/v1/chat';
  }

  getCredentials() {
    return {
      botId: config.providers.botpress.botId,
      apiKey: config.providers.botpress.apiKey,
      workspaceId: config.providers.botpress.workspaceId,
    };
  }

  isConfigured() {
    const { botId, apiKey } = this.getCredentials();
    return Boolean(botId && apiKey);
  }

  async getModels() {
    const { botId } = this.getCredentials();
    return [
      {
        id: botId || 'botpress-assistant',
        name: botId ? `Botpress Bot (${botId.slice(0, 8)}...)` : 'Botpress Cloud Bot',
        context_length: 8192,
        description: 'Autonomous dialogue flows, knowledge base searches, and workflow actions powered by Botpress',
      },
    ];
  }

  async sendMessage({ messages = [], externalConversationId = null }) {
    const { botId, apiKey } = this.getCredentials();
    if (!botId || !apiKey) {
      throw new Error(
        'Botpress is not configured. Please set BOTPRESS_BOT_ID and BOTPRESS_API_KEY in the server .env file.'
      );
    }

    // Get the latest user message
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    const messageText = lastUserMessage?.content || '';

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'x-bot-id': botId,
      'Content-Type': 'application/json',
    };

    try {
      let activeConversationId = externalConversationId;

      // Create conversation on Botpress if not already existing
      if (!activeConversationId) {
        const convRes = await axios.post(
          `${this.baseUrl}/conversations`,
          {},
          { headers, timeout: 20000 }
        );
        activeConversationId = convRes.data?.conversation?.id || convRes.data?.id;
      }

      // Post the message to Botpress
      const msgRes = await axios.post(
        `${this.baseUrl}/messages`,
        {
          conversationId: activeConversationId,
          payload: {
            type: 'text',
            text: messageText,
          },
        },
        { headers, timeout: 30000 }
      );

      // Wait briefly / poll for assistant reply if needed
      let botResponseContent = '';
      if (msgRes.data?.messages && msgRes.data.messages.length > 0) {
        const parsed = parseBotpressResponse(msgRes.data);
        botResponseContent = parsed.content;
      } else {
        // Poll conversation messages for latest bot response
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const listRes = await axios.get(
          `${this.baseUrl}/conversations/${activeConversationId}/messages`,
          { headers, timeout: 20000 }
        );
        const allMessages = listRes.data?.messages || [];
        const botMsgs = allMessages.filter(
          (m) => (m.userId !== lastUserMessage?.userId && m.direction !== 'incoming') || m.type === 'text'
        );
        const latestBotMsg = botMsgs[botMsgs.length - 1];
        botResponseContent = latestBotMsg?.payload?.text || latestBotMsg?.text || 'Message processed by Botpress.';
      }

      return {
        provider: 'botpress',
        model: botId,
        content: botResponseContent,
        externalConversationId: activeConversationId,
        tokenUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        finishReason: 'stop',
      };
    } catch (error) {
      const friendlyMessage = sanitizeErrorMessage(error, 'Botpress');
      const err = new Error(friendlyMessage);
      err.status = error.response?.status || 500;
      throw err;
    }
  }
}

module.exports = new BotpressProvider();
