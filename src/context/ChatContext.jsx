import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);

  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('openrouter');
  const [selectedModel, setSelectedModel] = useState('liquid/lfm-2.5-2.6b:free');
  const [availableModels, setAvailableModels] = useState([]);

  // LangChain Execution Mode & RAG State
  const [executionMode, setExecutionMode] = useState('direct'); // 'direct' | 'langchain'
  const [selectedTask, setSelectedTask] = useState('chat'); // 'chat' | 'rag' | 'summarization'
  const [documents, setDocuments] = useState([]);
  const [activeDocument, setActiveDocument] = useState(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);

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

  // 4. Fetch uploaded documents
  const fetchDocuments = useCallback(async () => {
    try {
      const res = await apiService.getDocuments(currentConversationId);
      if (res.success && res.data) {
        setDocuments(res.data);
        if (!activeDocument && res.data.length > 0) {
          setActiveDocument(res.data[0]);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch documents:', err.message);
    }
  }, [currentConversationId, activeDocument]);

  // 5. Load messages for specific conversation
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
    fetchDocuments();
  }, [fetchProviders, fetchConversations, fetchDocuments]);

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
        if (target.provider && target.provider.includes('huggingface')) setSelectedProvider('huggingface');
        else if (target.provider && target.provider.includes('botpress')) setSelectedProvider('botpress');
        else setSelectedProvider('openrouter');

        if (target.model) setSelectedModel(target.model);
        if (target.provider && target.provider.includes('langchain')) {
          setExecutionMode('langchain');
        }
      }
      await loadMessages(id);
    },
    [conversations, loadMessages]
  );

  // Start fresh new chat
  const startNewChat = useCallback(() => {
    setCurrentConversationId(null);
    setMessages([]);
    setError(null);
  }, []);

  // Document upload handler
  const uploadDocumentFile = async (file) => {
    if (!file) return;
    setUploadingDocument(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('document', file);
      if (currentConversationId) {
        formData.append('conversationId', currentConversationId);
      }

      const res = await apiService.uploadDocument(formData);
      if (res.success) {
        await fetchDocuments();
        setActiveDocument(res.data);
        return res.data;
      }
    } catch (err) {
      setError(`Document upload failed: ${err.message}`);
      throw err;
    } finally {
      setUploadingDocument(false);
    }
  };

  // Delete document
  const deleteDocumentFile = async (id) => {
    try {
      await apiService.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (activeDocument?.id === id) {
        setActiveDocument(null);
      }
    } catch (err) {
      setError(`Failed to delete document: ${err.message}`);
    }
  };

  // Send message
  const sendMessage = async (content) => {
    if (!content || !content.trim()) return;

    setError(null);
    setLoading(true);

    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      conversation_id: currentConversationId,
      role: 'user',
      content: content.trim(),
      provider: executionMode === 'langchain' ? `langchain (${selectedProvider})` : selectedProvider,
      model: selectedModel,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      let response;

      if (executionMode === 'langchain') {
        response = await apiService.sendLangChainChat({
          provider: selectedProvider,
          model: selectedModel,
          conversationId: currentConversationId,
          message: content.trim(),
          task: selectedTask,
          documentId: activeDocument?.id || null,
        });
      } else {
        response = await apiService.sendChatMessage({
          provider: selectedProvider,
          model: selectedModel,
          conversationId: currentConversationId,
          message: content.trim(),
          mode: 'direct',
        });
      }

      if (response.success && response.data) {
        const { conversationId, userMessage, assistantMessage, sources } = response.data;

        // If this was a new conversation, update currentConversationId
        if (!currentConversationId && conversationId) {
          setCurrentConversationId(conversationId);
          fetchConversations();
        }

        // Attach source citations if present
        const finalAssistantMsg = {
          ...assistantMessage,
          sources: sources || assistantMessage?.token_usage?.sources || [],
        };

        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
          return [...filtered, userMessage, finalAssistantMsg];
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to send message. Please try again.');
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setLoading(false);
    }
  };

  // Regenerate last response
  const regenerateLastResponse = async () => {
    if (messages.length === 0 || loading) return;

    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) return;

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
        executionMode,
        selectedTask,
        documents,
        activeDocument,
        uploadingDocument,
        loading,
        modelsLoading,
        conversationsLoading,
        error,
        setSelectedProvider,
        setSelectedModel,
        setExecutionMode,
        setSelectedTask,
        setActiveDocument,
        uploadDocumentFile,
        deleteDocumentFile,
        selectConversation,
        startNewChat,
        sendMessage,
        regenerateLastResponse,
        deleteConversation,
        renameConversation,
        clearError: () => setError(null),
        refreshConversations: fetchConversations,
        refreshDocuments: fetchDocuments,
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
