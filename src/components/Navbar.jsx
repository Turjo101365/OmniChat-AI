import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bot, Sparkles, MessageSquare, Database } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { getProviderBadgeInfo } from '../utils/helpers';

export default function Navbar() {
  const location = useLocation();
  const { providers, selectedProvider } = useChat();
  const currentBadge = getProviderBadgeInfo(selectedProvider);

  return (
    <header className="h-16 border-b border-gray-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-1.5">
              OmniChat <span className="text-blue-600 font-semibold text-xs px-1.5 py-0.5 bg-blue-50 rounded border border-blue-200">AI</span>
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex items-center gap-2 sm:gap-4">
        <Link
          to="/"
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            location.pathname === '/'
              ? 'text-blue-600 bg-blue-50/80 font-semibold'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Home
        </Link>
        <Link
          to="/chat"
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            location.pathname === '/chat'
              ? 'text-blue-600 bg-blue-50/80 font-semibold'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Chat
        </Link>
      </nav>

      {/* Right details */}
      <div className="flex items-center gap-3">
        {/* Active Provider Badge */}
        <div className={`hidden md:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${currentBadge.bgColor}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${currentBadge.dotColor}`}></span>
          <span>{currentBadge.icon} {currentBadge.label}</span>
        </div>

        {/* Database Status Link */}
        <a
          href="http://localhost:8090"
          target="_blank"
          rel="noopener noreferrer"
          title="Open phpMyAdmin (Port 8090)"
          className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 px-2.5 py-1 rounded-lg border border-gray-200 hover:border-blue-200 transition-colors bg-white shadow-2xs"
        >
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span>phpMyAdmin</span>
        </a>
      </div>
    </header>
  );
}
