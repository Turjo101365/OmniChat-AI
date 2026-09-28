const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const UsageLog = require('../models/UsageLog');
const providerManager = require('./providers/providerManager');

class ChatService {
  static async processChat({
    userId = 1,
    conversationId = null,
    provider = 'openrouter',
    model = null,
    message,
  }) {
    if (!message || typeof message !== 'string' || message.trim() === '') {
      const err = new Error('Message content cannot be empty.');
      err.status = 400;
      throw err;
    }

    let activeConversation = null;

    // 1. Get or create conversation
    if (conversationId) {
      activeConversation = await Conversation.findById(conversationId);
      if (!activeConversation) {
        const err = new Error(`Conversation with ID ${conversationId} not found.`);
        err.status = 404;
        throw err;
      }
    } else {
      // Create new conversation with title from message preview
      const previewTitle = message.trim().slice(0, 45) + (message.length > 45 ? '...' : '');
      activeConversation = await Conversation.create({
        userId,
        title: previewTitle,
        provider,
        model,
      });
    }

    const convId = activeConversation.id;

    // 2. Persist user message to MySQL
    const userMessageRecord = await Message.create({
      conversationId: convId,
      role: 'user',
      content: message.trim(),
      provider,
      model,
    });

    // 3. Retrieve recent conversation history for context
    const previousMessages = await Message.findByConversationId(convId);
    const messageHistory = previousMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // 4. Send request through Provider Abstraction Layer
    const aiResponse = await providerManager.sendMessage({
      provider,
      model,
      messages: messageHistory,
      conversationId: convId,
      externalConversationId: activeConversation.external_conversation_id,
    });

    // 5. Persist assistant message to MySQL
    const assistantMessageRecord = await Message.create({
      conversationId: convId,
      role: 'assistant',
      content: aiResponse.content,
      provider,
      model: aiResponse.model || model,
      tokenUsage: aiResponse.tokenUsage,
    });

    // 6. Record usage metrics in MySQL
    if (aiResponse.tokenUsage) {
      await UsageLog.create({
        userId,
        conversationId: convId,
        provider,
        model: aiResponse.model || model,
        inputTokens: aiResponse.tokenUsage.inputTokens || 0,
        outputTokens: aiResponse.tokenUsage.outputTokens || 0,
        totalTokens: aiResponse.tokenUsage.totalTokens || 0,
      });
    }

    // 7. Update conversation metadata if needed
    const updates = {
      provider,
      model: aiResponse.model || model,
    };
    if (aiResponse.externalConversationId) {
      updates.externalConversationId = aiResponse.externalConversationId;
    }
    await Conversation.update(convId, updates);

    return {
      conversationId: convId,
      userMessage: userMessageRecord,
      assistantMessage: assistantMessageRecord,
      provider,
      model: aiResponse.model || model,
      tokenUsage: aiResponse.tokenUsage,
    };
  }
}

module.exports = ChatService;
