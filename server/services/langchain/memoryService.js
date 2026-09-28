const { HumanMessage, AIMessage, SystemMessage } = require('@langchain/core/messages');
const Message = require('../../models/Message');

class MemoryService {
  /**
   * Retrieves conversation history from MySQL and converts to LangChain message instances
   */
  static async getConversationHistory(conversationId, limit = 20) {
    if (!conversationId) return [];

    const dbMessages = await Message.findByConversationId(conversationId);
    // Slice to limit recent messages to avoid context overflow
    const recent = dbMessages.slice(-limit);

    return this.convertToLangChainMessages(recent);
  }

  /**
   * Converts array of MySQL message rows to LangChain BaseMessage objects
   */
  static convertToLangChainMessages(messages = []) {
    return messages.map((m) => {
      if (m.role === 'user') {
        return new HumanMessage(m.content);
      }
      if (m.role === 'assistant') {
        return new AIMessage(m.content);
      }
      return new SystemMessage(m.content);
    });
  }

  /**
   * Persists message to MySQL
   */
  static async saveMessage({
    conversationId,
    role,
    content,
    provider = 'langchain',
    model = 'langchain-model',
    tokenUsage = null,
  }) {
    return await Message.create({
      conversationId,
      role,
      content,
      provider,
      model,
      tokenUsage,
    });
  }
}

module.exports = MemoryService;
