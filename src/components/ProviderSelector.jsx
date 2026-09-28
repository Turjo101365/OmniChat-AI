import React from 'react';
import { useChat } from '../hooks/useChat';
import { ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProviderSelector() {
  const { providers, selectedProvider, setSelectedProvider } = useChat();

  const currentProvider = providers.find((p) => p.id === selectedProvider) || {
    id: selectedProvider,
    name: selectedProvider === 'openrouter' ? 'OpenRouter' : selectedProvider === 'huggingface' ? 'Hugging Face' : 'Botpress',
    configured: true,
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:inline">
        AI Provider:
      </span>
      <div className="relative inline-block">
        <select
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value)}
          className="appearance-none bg-white hover:bg-gray-50 text-gray-800 text-xs sm:text-sm font-medium pl-3 pr-8 py-1.5 rounded-lg border border-gray-200 shadow-2xs hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
        >
          {providers.length > 0 ? (
            providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.configured ? '●' : '○'}
              </option>
            ))
          ) : (
            <>
              <option value="openrouter">OpenRouter ●</option>
              <option value="huggingface">Hugging Face ○</option>
              <option value="botpress">Botpress ○</option>
            </>
          )}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Configured Status Pill */}
      {currentProvider.configured ? (
        <span
          title="Provider API key configured"
          className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Ready
        </span>
      ) : (
        <span
          title="Set API key in .env to enable"
          className="flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Setup needed
        </span>
      )}
    </div>
  );
}
