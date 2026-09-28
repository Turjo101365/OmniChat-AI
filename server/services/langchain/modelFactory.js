const { ChatOpenAI } = require('@langchain/openai');
const config = require('../../config/env');

class ModelFactory {
  /**
   * Dynamically constructs a LangChain-compatible Chat Model
   * based on the selected provider and model name.
   */
  static createModel({
    provider = 'openrouter',
    model,
    streaming = false,
    temperature = 0.7,
    maxTokens = 2048,
  }) {
    const normProvider = (provider || 'openrouter').toLowerCase().trim();

    if (normProvider === 'openrouter') {
      const apiKey = config.providers.openrouter.apiKey;
      if (!apiKey) {
        throw new Error('OpenRouter API key is not configured. Please set OPENROUTER_API_KEY in .env.');
      }

      const selectedModel = model || config.providers.openrouter.defaultModel || 'nex-agi/nex-n2.5-mini:free';

      return new ChatOpenAI({
        model: selectedModel,
        apiKey: apiKey,
        openAIApiKey: apiKey,
        configuration: {
          baseURL: 'https://openrouter.ai/api/v1',
          defaultHeaders: {
            'HTTP-Referer': config.clientUrl,
            'X-Title': 'OmniChat AI LangChain Layer',
          },
        },
        temperature,
        maxTokens,
        streaming,
      });
    }

    if (normProvider === 'huggingface') {
      const token = config.providers.huggingface.apiKey;
      if (!token) {
        throw new Error('Hugging Face API key is not configured. Please set HF_TOKEN in .env.');
      }

      let selectedModel = model || config.providers.huggingface.defaultModel || 'Qwen/Qwen2.5-72B-Instruct:fastest';
      // Strip :fastest if present when passing to router endpoint
      const routerModel = selectedModel.replace(/:fastest$/, '');

      return new ChatOpenAI({
        model: routerModel,
        apiKey: token,
        openAIApiKey: token,
        configuration: {
          baseURL: 'https://router.huggingface.co/v1',
          defaultHeaders: {
            'Authorization': `Bearer ${token}`,
          },
        },
        temperature,
        maxTokens,
        streaming,
      });
    }

    if (normProvider === 'anthropic') {
      const { ChatAnthropic } = require('@langchain/anthropic');
      const apiKey = config.providers.anthropic?.apiKey;
      if (!apiKey) {
        throw new Error('Anthropic API key is not configured. Please set ANTHROPIC_API_KEY in .env.');
      }

      const selectedModel = model || config.providers.anthropic?.defaultModel || 'claude-3-5-sonnet-20241022';

      return new ChatAnthropic({
        modelName: selectedModel,
        anthropicApiKey: apiKey,
        temperature,
        maxTokens,
        streaming,
      });
    }

    throw new Error(
      `Unsupported provider for LangChain execution: "${provider}". Supported: openrouter, huggingface, anthropic.`
    );
  }
}


module.exports = ModelFactory;
