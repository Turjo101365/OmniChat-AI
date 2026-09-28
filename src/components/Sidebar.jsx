import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  User,
  Database,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { formatDate, getProviderBadgeInfo } from '../utils/helpers';

export default function Sidebar({ isOpen, setIsOpen }) {
  const {
    conversations,
    currentConversationId,
    selectConversation,
    startNewChat,
    deleteConversation,
    renameConversation,
    conversationsLoading,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Filter conversations
  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startRenaming = (c, e) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditTitle(c.title);
  };

  const handleSaveRename = (id, e) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      renameConversation(id, editTitle);
    }
    setEditingId(null);
  };

  const handleCancelRename = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    deleteConversation(id);
    setConfirmDeleteId(null);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-gray-50/95 border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header: New Chat */}
        <div className="p-3.5 border-b border-gray-200">
          <button
            onClick={() => {
              startNewChat();
              if (window.innerWidth < 768) setIsOpen(false);
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white hover:bg-gray-100/80 text-gray-800 text-sm font-semibold rounded-xl border border-gray-200/90 shadow-2xs hover:border-gray-300 transition-all group"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
              <span>New Chat</span>
            </span>
            <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
              ⌘K
            </span>
          </button>

          {/* Search Input */}
          <div className="relative mt-2.5">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-8 pr-3 py-1.5 bg-white text-xs text-gray-800 placeholder:text-gray-400 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {conversationsLoading ? (
            <div className="p-4 text-center text-xs text-gray-400">
              Loading chat history...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400">
              {searchQuery ? 'No matching conversations' : 'No conversations yet. Start a new chat!'}
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isActive = c.id === currentConversationId;
              const badge = getProviderBadgeInfo(c.provider);

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    selectConversation(c.id);
                    if (window.innerWidth < 768) setIsOpen(false);
                  }}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs sm:text-sm transition-all ${
                    isActive
                      ? 'bg-white text-gray-900 font-medium shadow-2xs border border-gray-200'
                      : 'text-gray-600 hover:bg-gray-100/70 hover:text-gray-900 border border-transparent'
                  }`}
                >
                  {editingId === c.id ? (
                    <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 px-2 py-0.5 text-xs bg-white border border-blue-400 rounded focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(c.id, e);
                          if (e.key === 'Escape') handleCancelRename(e);
                        }}
                      />
                      <button
                        onClick={(e) => handleSaveRename(c.id, e)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        title="Save"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleCancelRename}
                        className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2.5 truncate flex-1 min-w-0 mr-2">
                        <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                        <div className="truncate">
                          <span className="truncate block font-medium">{c.title}</span>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <span>{badge.icon}</span>
                            <span>{badge.label}</span>
                            <span>•</span>
                            <span>{formatDate(c.updated_at || c.created_at)}</span>
                          </span>
                        </div>
                      </div>

                      {/* Action buttons (Rename & Delete) */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {confirmDeleteId === c.id ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => handleDelete(c.id, e)}
                              className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[10px] font-semibold hover:bg-rose-700"
                              title="Confirm delete"
                            >
                              Del
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(null);
                              }}
                              className="p-0.5 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={(e) => startRenaming(c, e)}
                              className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 rounded transition-colors"
                              title="Rename chat"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(c.id);
                              }}
                              className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Delete chat"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* User / Profile Footer */}
        <div className="p-3 border-t border-gray-200 bg-white/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-800 to-slate-600 text-white flex items-center justify-center font-medium text-xs shrink-0 shadow-2xs">
              <User className="w-4 h-4" />
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-gray-900 truncate">Demo User</p>
              <p className="text-[11px] text-gray-400 truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                MySQL Connected
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
