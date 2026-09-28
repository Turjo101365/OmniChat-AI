const ChainService = require('./chainService');
const RagService = require('./ragService');
const DocumentService = require('./documentService');
const MemoryService = require('./memoryService');
const Conversation = require('../../models/Conversation');
const UsageLog = require('../../models/UsageLog');

class LangChainService {
  /**
   * Unified LangChain chat processor supporting general chat, RAG, and summarization
   */
  static async processChat({
    userId = 1,
    conversationId = null,
    provider = 'openrouter',
    model,
    message,
    task = 'chat', // 'chat' | 'rag' | 'summarization'
    documentId = null,
    customSystemPrompt,
  }) {
    if (!message || typeof message !== 'string' || message.trim() === '') {
      throw new Error('Message is required.');
    }

    // 1. Get or create conversation in MySQL
    let activeConv = null;
    if (conversationId) {
      activeConv = await Conversation.findById(conversationId);
    }
    if (!activeConv) {
      const title = message.trim().slice(0, 45) + (message.length > 45 ? '...' : '');
      activeConv = await Conversation.create({
        userId,
        title,
        provider: `${provider} (LangChain)`,
        model: model || 'default',
      });
    }

    const convId = activeConv.id;

    // 2. Persist user message in MySQL
    const userMsg = await MemoryService.saveMessage({
      conversationId: convId,
      role: 'user',
      content: message.trim(),
      provider: 'langchain',
      model: model || 'default',
    });

    let assistantContent = '';
    let sources = [];

    // 3. Route according to requested Task
    if (task === 'rag') {
      const ragResult = await RagService.query({
        provider,
        model,
        documentId,
        conversationId: convId,
        question: message.trim(),
      });
      assistantContent = ragResult.answer;
      sources = ragResult.sources;
    } else if (task === 'summarization') {
      assistantContent = await ChainService.invokeSummarizationChain({
        provider,
        model,
        text: message.trim(),
      });
    } else {
      // General conversational chat
      const chatResult = await ChainService.invokeChatChain({
        provider,
        model,
        conversationId: convId,
        message: message.trim(),
        customSystemPrompt,
      });
      assistantContent = chatResult.content;
    }

    // 4. Persist assistant message in MySQL
    const tokenMetadata = {
      task,
      hasSources: sources.length > 0,
      sources,
      engine: 'langchain',
    };

    const assistantMsg = await MemoryService.saveMessage({
      conversationId: convId,
      role: 'assistant',
      content: assistantContent,
      provider: 'langchain',
      model: model || 'langchain-model',
      tokenUsage: tokenMetadata,
    });

    // 5. Update Conversation timestamp
    await Conversation.update(convId, {
      provider: `langchain (${provider})`,
      model: model || 'langchain-model',
    });

    return {
      conversationId: convId,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      sources,
      task,
      provider,
      model,
    };
  }

  /**
   * Processes streaming chat through LangChain Runnable and SSE
   */
  static async streamChat({
    userId = 1,
    conversationId,
    provider = 'openrouter',
    model,
    message,
    customSystemPrompt,
    onToken,
  }) {
    let activeConv = null;
    if (conversationId) {
      activeConv = await Conversation.findById(conversationId);
    }
    if (!activeConv) {
      const title = message.trim().slice(0, 45) + (message.length > 45 ? '...' : '');
      activeConv = await Conversation.create({
        userId,
        title,
        provider: `langchain (${provider})`,
        model: model || 'default',
      });
    }

    const convId = activeConv.id;

    // Save user message
    const userMsg = await MemoryService.saveMessage({
      conversationId: convId,
      role: 'user',
      content: message.trim(),
      provider: 'langchain',
      model: model || 'default',
    });

    // Stream
    const fullText = await ChainService.streamChatChain({
      provider,
      model,
      conversationId: convId,
      message: message.trim(),
      customSystemPrompt,
      onToken,
    });

    // Save assistant message after completion
    const assistantMsg = await MemoryService.saveMessage({
      conversationId: convId,
      role: 'assistant',
      content: fullText,
      provider: 'langchain',
      model: model || 'langchain-model',
      tokenUsage: { engine: 'langchain', streaming: true },
    });

    return {
      conversationId: convId,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
    };
  }
}

module.exports = LangChainService;
