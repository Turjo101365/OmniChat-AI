import React from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { getProviderBadgeInfo } from '../utils/helpers';

export default function LoadingIndicator() {
  const { selectedProvider } = useChat();
  const badge = getProviderBadgeInfo(selectedProvider);

  return (
    <div className="flex items-start gap-3 my-4 animate-in fade-in duration-300">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-2xs">
        <Bot className="w-4 h-4" />
      </div>

      <div className="bg-white border border-gray-200/80 rounded-2xl rounded-tl-sm px-4 py-3 shadow-2xs flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]"></span>
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"></span>
        </div>
        <span className="text-xs text-gray-500 font-medium">
          {badge.label} is generating a response...
        </span>
      </div>
    </div>
  );
}
