import React from 'react';
import { useChat } from '../hooks/useChat';
import { ChevronDown, Sparkles, Loader2 } from 'lucide-react';
import { formatModelName } from '../utils/helpers';

export default function ModelSelector() {
  const { selectedProvider, selectedModel, setSelectedModel, availableModels, modelsLoading } = useChat();

  if (selectedProvider === 'botpress') {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
        <span className="font-semibold uppercase tracking-wider text-gray-400">Bot:</span>
        <span className="font-medium text-gray-700">Cloud Webchat / Workflow</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:inline">
        Model:
      </span>
      <div className="relative inline-block max-w-[220px] sm:max-w-[280px]">
        {modelsLoading ? (
          <div className="flex items-center gap-2 text-xs text-gray-400 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
            <span>Loading models...</span>
          </div>
        ) : (
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full truncate appearance-none bg-white hover:bg-gray-50 text-gray-800 text-xs sm:text-sm font-medium pl-3 pr-8 py-1.5 rounded-lg border border-gray-200 shadow-2xs hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
          >
            {availableModels.length > 0 ? (
              availableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name || formatModelName(m.id)} {m.isFree ? '(Free)' : ''}
                </option>
              ))
            ) : (
              <option value={selectedModel}>{formatModelName(selectedModel)}</option>
            )}
          </select>
        )}
        {!modelsLoading && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    </div>
  );
}
