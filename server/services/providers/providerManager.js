const huggingfaceProvider = require('./huggingfaceProvider');
const openrouterProvider = require('./openrouterProvider');
const botpressProvider = require('./botpressProvider');

class ProviderManager {
  constructor() {
    this.providers = {
      huggingface: huggingfaceProvider,
      openrouter: openrouterProvider,
      botpress: botpressProvider,
    };
  }

  getProvider(providerName) {
    const key = (providerName || '').toLowerCase().trim();
    const provider = this.providers[key];
    if (!provider) {
      throw new Error(
        `Unsupported AI provider: "${providerName}". Supported providers are: huggingface, openrouter, botpress.`
      );
    }
    return provider;
  }

  async getProvidersList() {
    return [
      {
        id: 'openrouter',
        name: 'OpenRouter',
        description: 'Universal gateway providing unified access to top open-source & proprietary LLMs',
        configured: openrouterProvider.isConfigured(),
        badge: '🌐 Gateway',
      },
      {
        id: 'huggingface',
        name: 'Hugging Face',
        description: 'Serverless Inference Providers running open-weights community models',
        configured: huggingfaceProvider.isConfigured(),
        badge: '🤗 Open Source',
      },
      {
        id: 'botpress',
        name: 'Botpress',
        description: 'Enterprise generative autonomous bot and dialogue management platform',
        configured: botpressProvider.isConfigured(),
        badge: '🤖 Autonomous Bot',
      },
    ];
  }

  async getModels(providerName) {
    const provider = this.getProvider(providerName);
    return await provider.getModels();
  }

  /**
   * Executes message sending with support for both:
   * 1. DIRECT mode (direct provider SDK/HTTP calls)
   * 2. LANGCHAIN mode (LangChain Runnable chains, prompt templates & RAG)
   */
  async sendMessage({
    provider,
    model,
    messages = [],
    conversationId,
    externalConversationId,
    mode = 'direct',
    task = 'chat',
    documentId = null,
  }) {
    if (mode === 'langchain') {
      const LangChainService = require('../langchain/langchainService');
      const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
      const messageContent = lastUserMessage?.content || '';

      const lcResult = await LangChainService.processChat({
        conversationId,
        provider,
        model,
        message: messageContent,
        task,
        documentId,
      });

      return {
        provider: `langchain (${provider})`,
        model: lcResult.model,
        content: lcResult.assistantMessage.content,
        sources: lcResult.sources || [],
        tokenUsage: lcResult.assistantMessage.token_usage,
        finishReason: 'stop',
      };
    }

    // Default: Direct execution path
    const activeProvider = this.getProvider(provider);
    return await activeProvider.sendMessage({
      model,
      messages,
      conversationId,
      externalConversationId,
    });
  }
}

module.exports = new ProviderManager();
