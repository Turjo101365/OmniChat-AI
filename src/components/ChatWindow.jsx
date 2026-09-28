import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Sparkles,
  Plus,
  Compass,
  Code,
  BrainCircuit,
  ShieldCheck,
  FileText,
  Upload,
  Layers,
} from 'lucide-react';
import { useChat } from '../hooks/useChat';
import ProviderSelector from './ProviderSelector';
import ModelSelector from './ModelSelector';
import MessageBubble from './MessageBubble';
import LoadingIndicator from './LoadingIndicator';
import ErrorMessage from './ErrorMessage';
import MessageInput from './MessageInput';
import DocumentUploadModal from './DocumentUploadModal';

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
    executionMode,
    setExecutionMode,
    selectedTask,
    setSelectedTask,
    documents,
    activeDocument,
  } = useChat();

  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
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
      <div className="min-h-16 py-2 border-b border-gray-200 bg-white/95 backdrop-blur-md px-4 flex flex-wrap items-center justify-between gap-3 z-20 shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Mobile Sidebar Toggle */}
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mode Switcher: Direct vs LangChain */}
          <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
            <button
              onClick={() => setExecutionMode('direct')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                executionMode === 'direct'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Direct communication with selected provider"
            >
              ⚡ Direct
            </button>
            <button
              onClick={() => setExecutionMode('langchain')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                executionMode === 'langchain'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="LangChain orchestration layer with prompt templates, memory, and RAG"
            >
              🧠 LangChain
            </button>
          </div>

          <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>

          {/* Provider & Model Selector */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <ProviderSelector />
            <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>
            <ModelSelector />
          </div>

          {/* If LangChain Mode: Task Selector & RAG Knowledge Base */}
          {executionMode === 'langchain' && (
            <>
              <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:inline">
                  Task:
                </span>
                <select
                  value={selectedTask}
                  onChange={(e) => setSelectedTask(e.target.value)}
                  className="appearance-none bg-blue-50/70 hover:bg-blue-50 text-blue-900 text-xs font-semibold px-2.5 py-1 rounded-lg border border-blue-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs"
                >
                  <option value="chat">💬 General Chat</option>
                  <option value="rag">📄 RAG (Doc Q&A)</option>
                  <option value="summarization">📝 Summarization</option>
                </select>

                {selectedTask === 'rag' && (
                  <button
                    onClick={() => setIsDocModalOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-medium rounded-lg border border-amber-200 shadow-2xs transition-colors"
                    title="Manage RAG Knowledge Base documents"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span className="truncate max-w-[130px]">
                      {activeDocument ? activeDocument.original_filename : `Doc (${documents.length})`}
                    </span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* New Chat Button */}
          <button
            onClick={startNewChat}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors shadow-2xs"
            title="Start new conversation"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Error Alert Display */}
      <ErrorMessage />

      {/* Active LangChain Mode Banner */}
      {executionMode === 'langchain' && (
        <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-blue-50/90 border-b border-blue-100 px-4 py-1.5 text-xs text-blue-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold flex items-center gap-1">
              🧠 LangChain Mode Active:
            </span>
            <span className="text-blue-700 capitalize">
              Task: {selectedTask === 'rag' ? 'RAG Document Q&A' : selectedTask}
            </span>
            {selectedTask === 'rag' && activeDocument && (
              <span className="bg-white px-2 py-0.5 rounded text-[11px] border border-blue-200 text-blue-800 font-medium">
                📄 Context: {activeDocument.original_filename}
              </span>
            )}
          </div>
          {selectedTask === 'rag' && (
            <button
              onClick={() => setIsDocModalOpen(true)}
              className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>Switch Document</span>
            </button>
          )}
        </div>
      )}

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
                {executionMode === 'langchain'
                  ? 'LangChain AI Orchestration'
                  : 'How can I assist you today?'}
              </h2>
              <p className="text-sm text-gray-500 max-w-md mt-2">
                {executionMode === 'langchain'
                  ? selectedTask === 'rag'
                    ? 'Upload any PDF or document and ask questions with verified source citations.'
                    : 'Prompt templates, Runnable chains, and persistent conversation memory enabled.'
                  : 'Select your preferred AI provider above and enter any question or prompt below.'}
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

      {/* Document Upload Modal for RAG */}
      <DocumentUploadModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
      />
    </div>
  );
}
