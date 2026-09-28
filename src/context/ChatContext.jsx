import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);

  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('openrouter');
  const [selectedModel, setSelectedModel] = useState('nex-agi/nex-n2.5-mini:free');
  const [availableModels, setAvailableModels] = useState([]);

  const [loading, setLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Fetch supported providers on mount
  const fetchProviders = useCallback(async () => {
    try {
      const res = await apiService.getProviders();
      if (res.success && res.data) {
        setProviders(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch providers:', err.message);
    }
  }, []);

  // 2. Fetch models when selectedProvider changes
  const fetchModels = useCallback(async (provider) => {
    setModelsLoading(true);
    try {
      const res = await apiService.getProviderModels(provider);
      if (res.success && res.data) {
        setAvailableModels(res.data);
        // Default to first model if current selected model not in list
        const exists = res.data.some((m) => m.id === selectedModel);
        if (!exists && res.data.length > 0) {
          setSelectedModel(res.data[0].id);
        }
      }
    } catch (err) {
      console.warn(`Failed to fetch models for ${provider}:`, err.message);
      setAvailableModels([]);
    } finally {
      setModelsLoading(false);
    }
  }, [selectedModel]);

  // 3. Fetch conversation list
  const fetchConversations = useCallback(async () => {
    setConversationsLoading(true);
    try {
      const res = await apiService.getConversations();
      if (res.success && res.data) {
        setConversations(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err.message);
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  // 4. Load messages for specific conversation
  const loadMessages = useCallback(async (convId) => {
    if (!convId) {
      setMessages([]);
      return;
    }
    try {
      const res = await apiService.getMessages(convId);
      if (res.success && res.data) {
        setMessages(res.data);
      }
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchProviders();
    fetchConversations();
  }, [fetchProviders, fetchConversations]);

  // Update models when provider changes
  useEffect(() => {
    fetchModels(selectedProvider);
  }, [selectedProvider, fetchModels]);

  // Select a conversation from sidebar
  const selectConversation = useCallback(
    async (id) => {
      setError(null);
      setCurrentConversationId(id);
      const target = conversations.find((c) => c.id === id);
      if (target) {
        if (target.provider) setSelectedProvider(target.provider);
        if (target.model) setSelectedModel(target.model);
      }
      await loadMessages(id);
    },
    [conversations, loadMessages]
  );

  // Start a fresh new chat
  const startNewChat = useCallback(() => {
    setCurrentConversationId(null);
    setMessages([]);
    setError(null);
  }, []);

  // Send message
  const sendMessage = async (content) => {
    if (!content || !content.trim()) return;

    setError(null);
    setLoading(true);

    // Optimistic user message update
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      conversation_id: currentConversationId,
      role: 'user',
      content: content.trim(),
      provider: selectedProvider,
      model: selectedModel,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await apiService.sendChatMessage({
        provider: selectedProvider,
        model: selectedModel,
        conversationId: currentConversationId,
        message: content.trim(),
      });

      if (response.success && response.data) {
        const { conversationId, userMessage, assistantMessage } = response.data;

        // If this was a new conversation, update currentConversationId
        if (!currentConversationId && conversationId) {
          setCurrentConversationId(conversationId);
          fetchConversations();
        }

        // Replace temp message with persisted message and append assistant message
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
          return [...filtered, userMessage, assistantMessage];
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to send message. Please try again.');
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setLoading(false);
    }
  };

  // Regenerate last response
  const regenerateLastResponse = async () => {
    if (messages.length === 0 || loading) return;

    // Find the last user message
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) return;

    // Pop the last assistant message if exists
    if (messages[messages.length - 1].role === 'assistant') {
      setMessages((prev) => prev.slice(0, -1));
    }

    await sendMessage(lastUserMsg.content);
  };

  // Delete conversation
  const deleteConversation = async (id) => {
    try {
      await apiService.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentConversationId === id) {
        startNewChat();
      }
    } catch (err) {
      setError(`Failed to delete conversation: ${err.message}`);
    }
  };

  // Rename conversation
  const renameConversation = async (id, newTitle) => {
    if (!newTitle || !newTitle.trim()) return;
    try {
      const res = await apiService.updateConversation(id, { title: newTitle.trim() });
      if (res.success) {
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, title: newTitle.trim() } : c))
        );
      }
    } catch (err) {
      setError(`Failed to rename conversation: ${err.message}`);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        currentConversationId,
        messages,
        providers,
        selectedProvider,
        selectedModel,
        availableModels,
        loading,
        modelsLoading,
        conversationsLoading,
        error,
        setSelectedProvider,
        setSelectedModel,
        selectConversation,
        startNewChat,
        sendMessage,
        regenerateLastResponse,
        deleteConversation,
        renameConversation,
        clearError: () => setError(null),
        refreshConversations: fetchConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}
