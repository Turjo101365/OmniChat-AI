import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, RotateCcw, Bot, User, Cpu, Sparkles } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { getProviderBadgeInfo, formatModelName, formatDate } from '../utils/helpers';

// Custom code block renderer with copy action
function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-xl overflow-hidden border border-gray-700/60 bg-slate-900 text-slate-100 shadow-md">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-800/80 border-b border-slate-700/50 text-xs text-slate-300">
        <span className="font-mono uppercase font-semibold text-[11px] text-slate-400 tracking-wider">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed text-slate-100 bg-slate-950">
        <code>{codeString}</code>
      </pre>
    </div>
  );
}

export default function MessageBubble({ message, isLastMessage }) {
  const { regenerateLastResponse, loading } = useChat();
  const [copiedResponse, setCopiedResponse] = useState(false);

  const isUser = message.role === 'user';
  const badge = getProviderBadgeInfo(message.provider);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  return (
    <div
      className={`flex items-start gap-3 my-4 group animate-in fade-in duration-200 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs ${
          isUser
            ? 'bg-slate-700'
            : 'bg-gradient-to-tr from-blue-600 to-indigo-600'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Bubble Content */}
      <div className={`max-w-[85%] sm:max-w-[78%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Header meta for AI message */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-1.5 text-xs text-gray-500">
            <span className={`inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full border text-[11px] ${badge.bgColor}`}>
              <span>{badge.icon}</span>
              <span>{badge.label}</span>
            </span>
            {message.model && (
              <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                {formatModelName(message.model)}
              </span>
            )}
            {message.token_usage && (
              <span className="text-[10px] text-gray-400 hidden sm:inline">
                {message.token_usage.totalTokens || message.token_usage.total_tokens || 0} tokens
              </span>
            )}
          </div>
        )}

        {/* Message body */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm sm:text-base leading-relaxed ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-sm shadow-xs font-normal'
              : 'bg-white border border-gray-200 text-gray-900 rounded-tl-sm shadow-2xs'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm sm:prose max-w-none text-gray-800 break-words">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    if (inline) {
                      return (
                        <code className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded font-mono text-xs border border-gray-200" {...props}>
                          {children}
                        </code>
                      );
                    }
                    return <CodeBlock className={className}>{children}</CodeBlock>;
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* RAG Source Citations */}
          {!isUser && (message.sources?.length > 0 || message.token_usage?.sources?.length > 0) && (
            <div className="mt-3 pt-2.5 border-t border-gray-100 w-full">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 mb-1.5">
                <span>📚 Grounded Sources:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(message.sources || message.token_usage.sources).map((src, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1 text-[11px] font-medium bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md border border-blue-200 shadow-2xs"
                    title={src.snippet || ''}
                  >
                    <span>📄 {src.document}</span>
                    <span className="text-blue-500 font-semibold">— Page {src.page}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions Bar for AI Response */}
        {!isUser && (
          <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopyMessage}
              className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 hover:text-gray-700 transition-colors"
              title="Copy entire response"
            >
              {copiedResponse ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 text-[11px]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Copy</span>
                </>
              )}
            </button>

            {isLastMessage && (
              <button
                onClick={regenerateLastResponse}
                disabled={loading}
                className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-50"
                title="Regenerate response"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span className="text-[11px]">Regenerate</span>
              </button>
            )}

            {message.created_at && (
              <span className="text-[11px] text-gray-400 ml-1">
                {formatDate(message.created_at)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
