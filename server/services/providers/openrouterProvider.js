const axios = require('axios');
const config = require('../../config/env');
const { parseOpenRouterResponse, sanitizeErrorMessage } = require('../../utils/responseParser');

const DEFAULT_MODELS = [
  { id: 'nex-agi/nex-n2.5-mini:free', name: 'Nex AGI: Nex N2.5 Mini (Free)', context_length: 32768, description: 'Fast, lightweight free reasoning model' },
  { id: 'nex-agi/nex-n2.5-pro:free', name: 'Nex AGI: Nex N2.5 Pro (Free)', context_length: 65536, description: 'High-capability free instruction and reasoning model' },
  { id: 'openai/gpt-4o', name: 'OpenAI: GPT-4o', context_length: 128000, description: 'Flagship high-intelligence multimodal model for complex reasoning' },
  { id: 'openai/gpt-4o-mini', name: 'OpenAI: GPT-4o Mini', context_length: 128000, description: 'Fast, cost-efficient model for focused lightweight tasks' },
  { id: 'anthropic/claude-3.5-haiku', name: 'Anthropic: Claude 3.5 Haiku', context_length: 200000, description: 'Rapid, ultra-responsive intelligent assistant' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek: V3 Chat', context_length: 64000, description: 'Advanced general-purpose reasoning model' },
];

class OpenRouterProvider {
  constructor() {
    this.name = 'openrouter';
    this.baseUrl = 'https://openrouter.ai/api/v1';
  }

  getApiKey() {
    return config.providers.openrouter.apiKey;
  }

  isConfigured() {
    return Boolean(this.getApiKey());
  }

  async getModels() {
    try {
      const apiKey = this.getApiKey();
      const headers = {
        'HTTP-Referer': config.clientUrl,
        'X-Title': 'AI Chatbot Web App',
      };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await axios.get(`${this.baseUrl}/models`, {
        headers,
        timeout: 10000,
      });

      if (response.data && Array.isArray(response.data.data)) {
        const fetched = response.data.data.map((m) => ({
          id: m.id,
          name: m.name || m.id,
          context_length: m.context_length || 4096,
          description: m.description || '',
          pricing: m.pricing || null,
          isFree: m.id.endsWith(':free'),
        }));

        // Put active free models and popular models first
        const freeModels = fetched.filter((m) => m.isFree);
        const popularIds = new Set(['openai/gpt-4o', 'openai/gpt-4o-mini', 'anthropic/claude-3.5-haiku', 'deepseek/deepseek-chat']);
        const popularModels = fetched.filter((m) => popularIds.has(m.id));
        const others = fetched.filter((m) => !m.isFree && !popularIds.has(m.id)).slice(0, 30);

        return [...freeModels, ...popularModels, ...others];
      }
      return DEFAULT_MODELS;
    } catch (error) {
      console.warn('[OpenRouter] Could not fetch live models, returning curated defaults:', error.message);
      return DEFAULT_MODELS;
    }
  }

  async sendMessage({ model, messages = [] }) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('OpenRouter API key is not configured. Please set OPENROUTER_API_KEY in .env.');
    }

    const selectedModel = model || config.providers.openrouter.defaultModel || 'nex-agi/nex-n2.5-mini:free';

    const formattedMessages = messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
      content: m.content,
    }));

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: selectedModel,
          messages: formattedMessages,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': config.clientUrl,
            'X-Title': 'AI Chatbot Web App',
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      );

      const parsed = parseOpenRouterResponse(response.data);
      return {
        provider: 'openrouter',
        model: selectedModel,
        content: parsed.content,
        tokenUsage: parsed.tokenUsage,
        finishReason: parsed.finishReason,
      };
    } catch (error) {
      const friendlyMessage = sanitizeErrorMessage(error, 'OpenRouter');
      const err = new Error(friendlyMessage);
      err.status = error.response?.status || 500;
      throw err;
    }
  }
}

module.exports = new OpenRouterProvider();
