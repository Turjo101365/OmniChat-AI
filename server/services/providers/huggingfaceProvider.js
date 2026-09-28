const { InferenceClient } = require('@huggingface/inference');
const config = require('../../config/env');
const { sanitizeErrorMessage } = require('../../utils/responseParser');

const HF_SUPPORTED_MODELS = [
  {
    id: 'Qwen/Qwen2.5-72B-Instruct:fastest',
    name: 'Qwen: Qwen2.5 72B Instruct (Fastest Provider)',
    context_length: 131072,
    description: 'Top-tier multilingual and reasoning model automatically routed to the fastest available inference provider',
  },
  {
    id: 'meta-llama/Llama-3.3-70B-Instruct:fastest',
    name: 'Meta: Llama 3.3 70B Instruct (Fastest Provider)',
    context_length: 131072,
    description: 'Flagship Meta open-weights 70B parameter model with industry-leading reasoning benchmarks',
  },
  {
    id: 'meta-llama/Llama-3.1-8B-Instruct:fastest',
    name: 'Meta: Llama 3.1 8B Instruct (Fastest Provider)',
    context_length: 131072,
    description: 'Ultra-fast and efficient instruction model for everyday chat, summarization, and coding',
  },
  {
    id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B:fastest',
    name: 'DeepSeek: R1 Distill Qwen 32B (Fastest Provider)',
    context_length: 64000,
    description: 'Specialized mathematical and logical distilled reasoning model',
  },
  {
    id: 'mistralai/Mistral-7B-Instruct-v0.3:fastest',
    name: 'Mistral: 7B Instruct v0.3 (Fastest Provider)',
    context_length: 32768,
    description: 'High performance European open-weights model with function-calling capabilities',
  },
];

class HuggingFaceProvider {
  constructor() {
    this.name = 'huggingface';
    this.client = null;
    this.lastToken = null;
  }

  getToken() {
    return config.providers.huggingface.apiKey;
  }

  getClient() {
    const token = this.getToken();
    if (!token) return null;
    if (!this.client || this.lastToken !== token) {
      this.client = new InferenceClient(token);
      this.lastToken = token;
    }
    return this.client;
  }

  isConfigured() {
    return Boolean(this.getToken());
  }

  async getModels() {
    return HF_SUPPORTED_MODELS;
  }

  async sendMessage({ model, messages = [] }) {
    const token = this.getToken();
    if (!token) {
      throw new Error(
        'Hugging Face API key is not configured. Please set HF_TOKEN or HF_API_KEY in the backend .env file.'
      );
    }

    let selectedModel = model || config.providers.huggingface.defaultModel || 'Qwen/Qwen2.5-72B-Instruct:fastest';

    // If model has no routing suffix, append :fastest to use HF Inference Providers routing
    if (!selectedModel.includes(':') && !selectedModel.startsWith('http')) {
      selectedModel = `${selectedModel}:fastest`;
    }

    const formattedMessages = messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
      content: m.content,
    }));

    const client = this.getClient();

    try {
      const response = await client.chatCompletion({
        model: selectedModel,
        messages: formattedMessages,
        max_tokens: 1024,
      });

      const choice = response?.choices?.[0];
      const content = choice?.message?.content || '';
      const finishReason = choice?.finish_reason || 'stop';

      const usage = response?.usage || {};
      const tokenUsage = {
        inputTokens: usage.prompt_tokens || 0,
        outputTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || ((usage.prompt_tokens || 0) + (usage.completion_tokens || 0)),
      };

      return {
        provider: 'huggingface',
        model: selectedModel,
        content: content.trim(),
        tokenUsage,
        finishReason,
      };
    } catch (error) {
      const friendlyMessage = sanitizeErrorMessage(error, 'Hugging Face');
      const err = new Error(friendlyMessage);
      err.status = error.status || error.response?.status || 500;
      throw err;
    }
  }
}

module.exports = new HuggingFaceProvider();
