import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Bot,
  Globe,
  Database,
  Shield,
  Layers,
  Cpu,
  CheckCircle2,
  Terminal,
  Zap,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useChat } from '../hooks/useChat';

export default function Home() {
  const { providers } = useChat();

  const isOpenRouterConfigured = providers.find((p) => p.id === 'openrouter')?.configured;
  const isHFConfigured = providers.find((p) => p.id === 'huggingface')?.configured;
  const isBotpressConfigured = providers.find((p) => p.id === 'botpress')?.configured;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-gray-100 bg-gradient-to-b from-blue-50/50 via-white to-white">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 text-blue-700 text-xs font-semibold mb-6 border border-blue-200 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Generation Multi-Provider AI Architecture</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight sm:leading-none">
            One Unified Platform. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Any AI Model You Choose.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Experience complete flexibility. Switch between Hugging Face Inference, OpenRouter gateway models, and Botpress autonomous bots with seamless MySQL history and zero-leak security.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              to="/chat"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-sm shadow-blue-500/30 hover:shadow-md transition-all group"
            >
              <span>Start Chatting</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="http://localhost:8090"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm border border-gray-200 transition-colors shadow-2xs"
            >
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Launch phpMyAdmin</span>
            </a>
          </div>
        </div>
      </section>

      {/* Supported AI Providers Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">
            Provider Abstraction Layer
          </h2>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
            Supported AI Providers
          </p>
          <p className="mt-2 text-sm text-gray-500 max-w-lg mx-auto">
            Interact with real model endpoints through our secure backend proxy architecture.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* OpenRouter Card */}
          <div className="p-6 rounded-2xl border border-gray-200/90 bg-white hover:border-emerald-300 hover:shadow-sm transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 text-2xl">
                  🌐
                </div>
                {isOpenRouterConfigured ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Active & Ready
                  </span>
                ) : (
                  <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                    Needs Key
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900">OpenRouter</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Universal gateway offering unified access to OpenAI GPT-4o, Anthropic Claude 3.5, Google Gemini 2.0, DeepSeek V3, and free open-weights models with automated token tracking.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100">
              <span className="text-[11px] font-mono text-gray-400">Endpoint: /api/chat/openrouter</span>
            </div>
          </div>

          {/* Hugging Face Card */}
          <div className="p-6 rounded-2xl border border-gray-200/90 bg-white hover:border-amber-300 hover:shadow-sm transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 text-2xl">
                  🤗
                </div>
                {isHFConfigured ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Configured
                  </span>
                ) : (
                  <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    Add HF_API_KEY
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900">Hugging Face</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Connect directly to Hugging Face Inference Providers running Llama-3.2-3B, Llama-3.1-8B, Mistral-7B-v0.3, Qwen2.5-72B, and Phi-3.5-mini.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100">
              <span className="text-[11px] font-mono text-gray-400">Endpoint: /api/chat/huggingface</span>
            </div>
          </div>

          {/* Botpress Card */}
          <div className="p-6 rounded-2xl border border-gray-200/90 bg-white hover:border-blue-300 hover:shadow-sm transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 text-2xl">
                  🤖
                </div>
                {isBotpressConfigured ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Configured
                  </span>
                ) : (
                  <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                    Add Bot ID
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900">Botpress</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Execute enterprise conversational flows, knowledge-base searches, and multi-step action workflows powered by Botpress Cloud.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100">
              <span className="text-[11px] font-mono text-gray-400">Endpoint: /api/chat/botpress</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-16 bg-gray-50/60 border-y border-gray-200/70 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Core Capabilities
            </h2>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
              Built for Production & Developer Freedom
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Provider Abstraction</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                The frontend communicates only with Node.js. The backend routes messages cleanly through <code className="text-blue-600 font-mono">providerManager.js</code>.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">MySQL 8 & phpMyAdmin</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Containerized in Docker with persistent volumes. Stores conversations, messages, token usage logs, and provider configurations.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Zero-Leak Security</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                API keys are strictly isolated in backend environment variables. Error messages are sanitized to prevent accidental secret leakage.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Markdown & Code Copy</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Full GitHub Flavored Markdown support with code syntax blocks, language tags, and single-click copy buttons.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Rate Limiting & Resiliency</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Automated rate limiting shields the server against spam. Built-in error handling translates API failures into actionable tips.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Extensible Architecture</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Modular service architecture makes it effortless to plug in Google Gemini, OpenAI, Ollama, Groq, or Together AI.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">
            Workflow
          </h2>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
            How It Works
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center mx-auto mb-4 shadow-sm">
              1
            </div>
            <h3 className="text-base font-bold text-gray-900">Pick Your Provider</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Select OpenRouter, Hugging Face, or Botpress directly from the top selector dropdown in the chat header.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center mx-auto mb-4 shadow-sm">
              2
            </div>
            <h3 className="text-base font-bold text-gray-900">Select Model</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Available models are dynamically loaded from the backend according to the chosen provider.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center mx-auto mb-4 shadow-sm">
              3
            </div>
            <h3 className="text-base font-bold text-gray-900">Engage & Persist</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Converse with real AI. Messages and token usage are safely persisted in MySQL and managed via phpMyAdmin.
            </p>
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="py-12 bg-gray-50 border-t border-gray-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-6">
            Powered by Modern Technologies
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm font-semibold text-gray-600">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-2xs">
              ⚡ React + Vite
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-2xs">
              🎨 Tailwind CSS
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-2xs">
              🟢 Node.js & Express
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-2xs">
              🐬 MySQL 8 (Docker)
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-2xs">
              📊 phpMyAdmin
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-white border-t border-gray-200 px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-400">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 OmniChat AI Platform. Built with React, Node.js, and MySQL.</p>
          <div className="flex items-center gap-4">
            <Link to="/chat" className="text-gray-600 hover:text-blue-600">
              Chat Interface
            </Link>
            <a
              href="http://localhost:8090"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-blue-600"
            >
              phpMyAdmin (Port 8090)
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
