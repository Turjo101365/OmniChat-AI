/**
 * Standardizes AI provider responses and token usage
 */
function parseOpenRouterResponse(data) {
  const choice = data?.choices?.[0];
  const message = choice?.message || {};
  const content = message?.content || '';
  const finishReason = choice?.finish_reason || 'stop';

  const usage = data?.usage || {};
  const tokenUsage = {
    inputTokens: usage.prompt_tokens || 0,
    outputTokens: usage.completion_tokens || 0,
    totalTokens: usage.total_tokens || ((usage.prompt_tokens || 0) + (usage.completion_tokens || 0)),
  };

  return {
    content,
    model: data?.model || 'openrouter-model',
    finishReason,
    tokenUsage,
  };
}

/**
 * Standardizes Hugging Face Inference responses (supports both OpenAI chat-compatible and legacy task output)
 */
function parseHuggingFaceResponse(data, requestedModel) {
  let content = '';
  let tokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  let finishReason = 'stop';

  if (data?.choices && Array.isArray(data.choices) && data.choices.length > 0) {
    // OpenAI-compatible chat format
    const choice = data.choices[0];
    content = choice.message?.content || '';
    finishReason = choice.finish_reason || 'stop';
    if (data.usage) {
      tokenUsage = {
        inputTokens: data.usage.prompt_tokens || 0,
        outputTokens: data.usage.completion_tokens || 0,
        totalTokens: data.usage.total_tokens || 0,
      };
    }
  } else if (Array.isArray(data) && data[0]?.generated_text) {
    content = data[0].generated_text;
  } else if (typeof data?.generated_text === 'string') {
    content = data.generated_text;
  } else if (typeof data === 'string') {
    content = data;
  } else {
    content = JSON.stringify(data);
  }

  return {
    content: content.trim(),
    model: requestedModel || 'huggingface-model',
    finishReason,
    tokenUsage,
  };
}

/**
 * Standardizes Botpress response
 */
function parseBotpressResponse(data) {
  let content = '';
  if (Array.isArray(data?.messages) && data.messages.length > 0) {
    const assistantMessages = data.messages
      .filter((m) => m.type === 'text' && m.payload?.text)
      .map((m) => m.payload.text);
    content = assistantMessages.join('\n\n') || data.messages[0]?.payload?.text || '';
  } else if (data?.message?.text) {
    content = data.message.text;
  } else if (data?.text) {
    content = data.text;
  } else if (typeof data === 'string') {
    content = data;
  }

  return {
    content: content.trim() || 'Bot completed response.',
    model: 'botpress-bot',
    finishReason: 'stop',
    tokenUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
    externalConversationId: data?.conversationId || null,
  };
}

/**
 * Maps external errors to clean, safe, user-friendly messages without exposing API keys or secrets.
 */
function sanitizeErrorMessage(error, provider = 'AI Provider') {
  const status = error.response?.status;
  const rawData = error.response?.data;
  const rawMsg = (typeof rawData === 'object' ? rawData?.error?.message || rawData?.message || rawData?.error : rawData) || error.message || '';

  // Prevent key leakage
  const cleanedMsg = String(rawMsg).replace(/(Bearer\s+[a-zA-Z0-9_\-\.]+)|(sk-[a-zA-Z0-9_\-\.]+)|(hf_[a-zA-Z0-9_\-\.]+)/gi, '[REDACTED_API_KEY]');

  if (status === 401 || status === 403) {
    return `${provider} authentication failed. Please verify your ${provider} API Key in the server configuration.`;
  }
  if (status === 429) {
    return `${provider} rate limit exceeded or credit balance exhausted. Please check your account quota or try another provider.`;
  }
  if (status === 404) {
    return `The requested ${provider} model or bot endpoint was not found. Please verify the model name.`;
  }
  if (status === 503 || status === 502 || status === 504) {
    return `${provider} is temporarily unavailable or loading. Please try again in a few moments.`;
  }
  if (cleanedMsg && !cleanedMsg.includes('<!DOCTYPE')) {
    return `${provider} error: ${cleanedMsg}`;
  }

  return `Failed to receive response from ${provider}. Please check your connection and configuration.`;
}

module.exports = {
  parseOpenRouterResponse,
  parseHuggingFaceResponse,
  parseBotpressResponse,
  sanitizeErrorMessage,
};
