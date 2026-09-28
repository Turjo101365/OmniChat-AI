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
    if (key === 'langgraph') {
      return null;
    }
    const provider = this.providers[key];
    if (!provider) {
      throw new Error(
        `Unsupported AI provider: "${providerName}". Supported providers are: huggingface, openrouter, botpress, langgraph.`
      );
    }
    return provider;
  }

  async getProvidersList() {
    return [
      {
        id: 'langgraph',
        name: 'LangGraph Agent',
        description: 'Multi-node stateful workflow with LangSmith observability and intelligent reasoning',
        configured: true,
        badge: '🕸️ LangGraph Agent',
      },
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
    const key = (providerName || '').toLowerCase().trim();
    if (key === 'langgraph') {
      return [
        { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B Instruct (Hugging Face)', context_length: 32768 },
        { id: 'meta-llama/Llama-3.1-8B-Instruct', name: 'Llama 3.1 8B Instruct (Hugging Face)', context_length: 131072 },
        { id: 'mistralai/Mistral-7B-Instruct-v0.3', name: 'Mistral 7B Instruct v0.3 (Hugging Face)', context_length: 32768 },
        { id: 'openai/gpt-4o', name: 'GPT-4o (OpenRouter / State of the Art)', context_length: 128000 },
        { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku (OpenRouter)', context_length: 200000 },
        { id: 'qwen/qwen3.8-27b:free', name: 'Qwen 3.8 27B (OpenRouter Free)', context_length: 32768 },
      ];
    }
    const provider = this.getProvider(providerName);
    return await provider.getModels();
  }

  /**
   * Executes message sending with support for both:
   * 1. DIRECT mode (direct provider SDK/HTTP calls)
   * 2. LANGCHAIN mode (LangChain Runnable chains, prompt templates & RAG)
   * 3. LANGGRAPH mode (Stateful multi-node Agent Graph with LangSmith tracing)
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
    if (provider === 'langgraph' || mode === 'langgraph') {
      const graphService = require('../langgraph/graphService');
      const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
      const messageContent = lastUserMessage?.content || '';

      // Determine underlying LLM provider
      let underlyingProvider = 'openrouter';
      if (
        model &&
        (model.startsWith('Qwen/') ||
          model.startsWith('meta-llama/Llama') ||
          model.startsWith('mistralai/') ||
          model.startsWith('microsoft/'))
      ) {
        underlyingProvider = 'huggingface';
      }

      const graphResult = await graphService.processChat({
        conversationId,
        provider: underlyingProvider,
        model: model || (underlyingProvider === 'huggingface' ? 'Qwen/Qwen2.5-72B-Instruct' : 'openai/gpt-4o'),
        message: messageContent,
        task,
        documentId,
      });

      return {
        provider: 'langgraph',
        model: graphResult.model,
        content: graphResult.assistantMessage.content,
        sources: graphResult.sources || [],
        tokenUsage: graphResult.assistantMessage.token_usage,
        finishReason: 'stop',
      };
    }


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
