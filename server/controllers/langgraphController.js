const graphService = require('../services/langgraph/graphService');

class LangGraphController {
  /**
   * POST /api/langgraph/chat
   * Synchronous LangGraph agent execution
   */
  static async chat(req, res, next) {
    try {
      const {
        provider = 'openrouter',
        model,
        conversationId,
        message,
        task = 'chat',
        documentId,
        customSystemPrompt,
      } = req.body;
      const userId = req.user?.id || 1;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Message is required and must be a string.',
        });
      }

      const result = await graphService.processChat({
        userId,
        conversationId: conversationId ? parseInt(conversationId, 10) : null,
        provider,
        model,
        message,
        task,
        documentId: documentId ? parseInt(documentId, 10) : null,
        customSystemPrompt,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/langgraph/state/:threadId
   */
  static async getState(req, res, next) {
    try {
      const { threadId } = req.params;
      const state = await graphService.getThreadState(threadId);
      return res.status(200).json({
        success: true,
        threadId,
        data: state,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/langgraph/nodes
   * Returns graph topology for UI/observability
   */
  static async getTopology(req, res, next) {
    try {
      return res.status(200).json({
        success: true,
        data: {
          name: 'OmniChat StateGraph Agent',
          nodes: [
            { id: 'classifier', description: 'Analyzes user intent and routes to task (RAG, reasoning, summary, chat)' },
            { id: 'retriever', description: 'Fetches relevant document chunks from MySQL vector store' },
            { id: 'generator', description: 'Invokes model with history, task instructions, and retrieved context' },
            { id: 'refiner', description: 'Validates response, appends citations, and formats output' },
          ],
          edges: [
            { from: 'START', to: 'classifier' },
            { from: 'classifier', to: 'retriever', condition: 'task == rag' },
            { from: 'classifier', to: 'generator', condition: 'task != rag' },
            { from: 'retriever', to: 'generator' },
            { from: 'generator', to: 'refiner' },
            { from: 'refiner', to: 'END' },
          ],
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = LangGraphController;
