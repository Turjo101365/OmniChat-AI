import React, { useEffect, useRef } from 'react';
import { Menu, Sparkles, Plus, Compass, Code, BrainCircuit, ShieldCheck } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import ProviderSelector from './ProviderSelector';
import ModelSelector from './ModelSelector';
import MessageBubble from './MessageBubble';
import LoadingIndicator from './LoadingIndicator';
import ErrorMessage from './ErrorMessage';
import MessageInput from './MessageInput';

const QUICK_STARTS = [
  {
    icon: Code,
    title: 'Code an Algorithm',
    prompt: 'Write a JavaScript function that implements a debounce wrapper with leading and trailing options.',
  },
  {
    icon: BrainCircuit,
    title: 'System Architecture',
    prompt: 'Explain the difference between monoliths, microservices, and modular monolith architectures.',
  },
  {
    icon: Compass,
    title: 'Creative Writing',
    prompt: 'Write a compelling sci-fi short story about an autonomous deep-space probe that discovers an anomalous signal.',
  },
  {
    icon: ShieldCheck,
    title: 'Security Best Practices',
    prompt: 'What are the top 5 essential backend security practices for protecting AI APIs against prompt injection and abuse?',
  },
];

export default function ChatWindow({ onToggleSidebar }) {
  const {
    messages,
    loading,
    selectedProvider,
    sendMessage,
    startNewChat,
    currentConversationId,
    conversations,
  } = useChat();

  const messagesEndRef = useRef(null);

  // Auto-scroll on new messages or loading change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const currentConv = conversations.find((c) => c.id === currentConversationId);

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
      {/* Top Header Bar */}
      <div className="h-16 border-b border-gray-200 bg-white/95 backdrop-blur-md px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          {/* Mobile Sidebar Toggle */}
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Provider & Model Selector */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <ProviderSelector />
            <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>
            <ModelSelector />
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={startNewChat}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
            title="Start new conversation"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Error Alert Display */}
      <ErrorMessage />

      {/* Message History Container */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            /* Empty State Hero */
            <div className="min-h-[50vh] flex flex-col items-center justify-center text-center py-12 px-4 animate-in fade-in duration-300">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 mb-4">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                How can I assist you today?
              </h2>
              <p className="text-sm text-gray-500 max-w-md mt-2">
                Select your preferred AI provider above (OpenRouter, Hugging Face, or Botpress) and enter any question or prompt below.
              </p>

              {/* Quick Start Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full max-w-2xl text-left">
                {QUICK_STARTS.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => sendMessage(item.prompt)}
                      className="p-3.5 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50/40 bg-white transition-all text-left group shadow-2xs"
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-800 group-hover:text-blue-600">
                        <Icon className="w-4 h-4 text-blue-500" />
                        <span>{item.title}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                        {item.prompt}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Messages List */
            <div className="space-y-4 pb-4">
              {messages.map((m, index) => (
                <MessageBubble
                  key={m.id || index}
                  message={m}
                  isLastMessage={index === messages.length - 1 && m.role === 'assistant'}
                />
              ))}

              {loading && <LoadingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Message Input Bottom Area */}
      <MessageInput />
    </div>
  );
}
