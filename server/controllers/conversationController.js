const conversationService = require('../services/conversationService');

class ConversationController {
  static async list(req, res, next) {
    try {
      const userId = req.user?.id || 1;
      const conversations = await conversationService.listConversations(userId);
      res.status(200).json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const conversation = await conversationService.getConversation(id);
      res.status(200).json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const userId = req.user?.id || 1;
      const { title, provider, model, externalConversationId } = req.body;
      const conversation = await conversationService.createConversation({
        userId,
        title,
        provider,
        model,
        externalConversationId,
      });
      res.status(201).json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const updates = req.body;
      const updated = await conversationService.updateConversation(id, updates);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      await conversationService.deleteConversation(id);
      res.status(200).json({
        success: true,
        message: 'Conversation deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMessages(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const messages = await conversationService.getMessages(id);
      res.status(200).json({
        success: true,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  }

  static async search(req, res, next) {
    try {
      const userId = req.user?.id || 1;
      const q = req.query.q || '';
      const results = await conversationService.searchConversations(userId, q);
      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ConversationController;
