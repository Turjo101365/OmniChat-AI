const chatService = require('../services/chatService');

class ChatController {
  // Unified chat endpoint: POST /api/chat
  static async handleChat(req, res, next) {
    try {
      const { provider = 'openrouter', model, conversationId, message } = req.body;
      const userId = req.user?.id || 1;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Message is required and must be a string.',
        });
      }

      const result = await chatService.processChat({
        userId,
        conversationId: conversationId ? parseInt(conversationId, 10) : null,
        provider,
        model,
        message,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Provider-specific endpoint: POST /api/chat/huggingface
  static async handleHuggingFaceChat(req, res, next) {
    req.body.provider = 'huggingface';
    return ChatController.handleChat(req, res, next);
  }

  // Provider-specific endpoint: POST /api/chat/openrouter
  static async handleOpenRouterChat(req, res, next) {
    req.body.provider = 'openrouter';
    return ChatController.handleChat(req, res, next);
  }

  // Provider-specific endpoint: POST /api/chat/botpress
  static async handleBotpressChat(req, res, next) {
    req.body.provider = 'botpress';
    return ChatController.handleChat(req, res, next);
  }
}

module.exports = ChatController;
