const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

class ConversationService {
  static async listConversations(userId = 1) {
    return await Conversation.findAllByUserId(userId);
  }

  static async getConversation(id) {
    const conv = await Conversation.findById(id);
    if (!conv) {
      const err = new Error('Conversation not found');
      err.status = 404;
      throw err;
    }
    return conv;
  }

  static async createConversation({ userId = 1, title, provider, model, externalConversationId }) {
    const initialTitle = title || 'New Conversation';
    return await Conversation.create({
      userId,
      title: initialTitle,
      provider: provider || 'openrouter',
      model: model || 'openai/gpt-4o',
      externalConversationId,
    });
  }

  static async updateConversation(id, updates) {
    await this.getConversation(id);
    return await Conversation.update(id, updates);
  }

  static async deleteConversation(id) {
    await this.getConversation(id);
    return await Conversation.delete(id);
  }

  static async getMessages(conversationId) {
    await this.getConversation(conversationId);
    return await Message.findByConversationId(conversationId);
  }

  static async searchConversations(userId = 1, query = '') {
    return await Conversation.search(userId, query);
  }
}

module.exports = ConversationService;
