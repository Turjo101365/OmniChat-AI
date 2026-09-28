const LangChainService = require('../services/langchain/langchainService');
const DocumentService = require('../services/langchain/documentService');
const RagService = require('../services/langchain/ragService');

class LangChainController {
  /**
   * Synchronous LangChain chat
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

      const result = await LangChainService.processChat({
        userId,
        conversationId: conversationId ? parseInt(conversationId, 10) : null,
        provider,
        model,
        message,
        task,
        documentId: documentId ? parseInt(documentId, 10) : null,
        customSystemPrompt,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Server-Sent Events (SSE) Streaming LangChain chat
   */
  static async stream(req, res, next) {
    try {
      const {
        provider = 'openrouter',
        model,
        conversationId,
        message,
        customSystemPrompt,
      } = req.body;
      const userId = req.user?.id || 1;

      if (!message) {
        return res.status(400).json({ success: false, error: 'Message is required.' });
      }

      // Configure SSE response headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      const result = await LangChainService.streamChat({
        userId,
        conversationId: conversationId ? parseInt(conversationId, 10) : null,
        provider,
        model,
        message,
        customSystemPrompt,
        onToken: (token) => {
          res.write(`data: ${JSON.stringify({ token })}\n\n`);
        },
      });

      // Send end of stream event
      res.write(`data: ${JSON.stringify({ done: true, data: result })}\n\n`);
      res.end();
    } catch (error) {
      if (!res.headersSent) {
        next(error);
      } else {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      }
    }
  }

  /**
   * Multipart document upload handler
   */
  static async uploadDocument(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No document file uploaded. Please upload a PDF, TXT, or MD document.',
        });
      }

      const userId = req.user?.id || 1;
      const conversationId = req.body.conversationId ? parseInt(req.body.conversationId, 10) : null;

      const processed = await DocumentService.processUploadedFile({
        userId,
        conversationId,
        filePath: req.file.path,
        originalFilename: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
      });

      res.status(201).json({
        success: true,
        message: 'Document successfully processed and indexed for RAG vector search.',
        data: processed,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List uploaded documents
   */
  static async listDocuments(req, res, next) {
    try {
      const userId = req.user?.id || 1;
      const conversationId = req.query.conversationId ? parseInt(req.query.conversationId, 10) : null;
      const docs = await DocumentService.listDocuments(userId, conversationId);

      res.status(200).json({
        success: true,
        data: docs,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete uploaded document
   */
  static async deleteDocument(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      await DocumentService.deleteDocument(id);

      res.status(200).json({
        success: true,
        message: 'Document and its vector chunks deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * RAG Query endpoint with source citations
   */
  static async queryRag(req, res, next) {
    try {
      const {
        provider = 'openrouter',
        model,
        documentId,
        conversationId,
        question,
      } = req.body;

      if (!question) {
        return res.status(400).json({
          success: false,
          error: 'Question is required for RAG query.',
        });
      }

      const ragResult = await RagService.query({
        provider,
        model,
        documentId: documentId ? parseInt(documentId, 10) : null,
        conversationId: conversationId ? parseInt(conversationId, 10) : null,
        question,
      });

      res.status(200).json({
        success: true,
        data: ragResult,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = LangChainController;
