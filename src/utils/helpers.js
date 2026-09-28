export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function getProviderBadgeInfo(provider) {
  const p = (provider || '').toLowerCase();
  if (p.includes('langgraph')) {
    return {
      label: 'LangGraph Agent',
      icon: '🕸️',
      bgColor: 'bg-purple-50 text-purple-700 border-purple-200',
      dotColor: 'bg-purple-500',
    };
  }

  switch (p) {

    case 'openrouter':
      return {
        label: 'OpenRouter',
        icon: '🌐',
        bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotColor: 'bg-emerald-500',
      };
    case 'huggingface':
      return {
        label: 'Hugging Face',
        icon: '🤗',
        bgColor: 'bg-amber-50 text-amber-700 border-amber-200',
        dotColor: 'bg-amber-500',
      };
    case 'botpress':
      return {
        label: 'Botpress',
        icon: '🤖',
        bgColor: 'bg-blue-50 text-blue-700 border-blue-200',
        dotColor: 'bg-blue-500',
      };
    case 'langgraph':
      return {
        label: 'LangGraph Agent',
        icon: '🕸️',
        bgColor: 'bg-purple-50 text-purple-700 border-purple-200',
        dotColor: 'bg-purple-500',
      };

    default:
      return {
        label: provider || 'AI',
        icon: '⚡',
        bgColor: 'bg-gray-100 text-gray-700 border-gray-200',
        dotColor: 'bg-gray-400',
      };
  }
}

export function formatModelName(modelId) {
  if (!modelId) return '';
  // If model is a path like meta-llama/Llama-3.2-3B-Instruct or openai/gpt-4o
  const parts = modelId.split('/');
  return parts[parts.length - 1] || modelId;
}
