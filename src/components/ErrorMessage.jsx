import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useChat } from '../hooks/useChat';

export default function ErrorMessage() {
  const { error, clearError } = useChat();

  if (!error) return null;

  const isMissingKey = error.toLowerCase().includes('not configured') || error.toLowerCase().includes('verify your');

  return (
    <div className="mx-4 my-3 p-3.5 bg-rose-50/90 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs sm:text-sm animate-in fade-in slide-in-from-top-2 duration-200 shadow-2xs">
      <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-semibold text-rose-900">Request Error</p>
        <p className="mt-0.5 text-rose-700 leading-relaxed">{error}</p>
        {isMissingKey && (
          <p className="mt-1 text-[11px] text-rose-600">
            Tip: Open your backend <code className="bg-rose-100 px-1 py-0.5 rounded font-mono text-rose-900">.env</code> file, set the provider's API key, and restart the server.
          </p>
        )}
      </div>
      <button
        onClick={clearError}
        className="text-rose-400 hover:text-rose-700 transition-colors p-1 -mr-1 -mt-1 rounded-lg hover:bg-rose-100"
        title="Dismiss error"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
