import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

// Response interceptor for consistent error extraction
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorMsg =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';
    return Promise.reject(new Error(errorMsg));
  }
);

export const apiService = {
  // System Health
  getHealth: () => api.get('/health'),

  // Providers & Models
  getProviders: () => api.get('/providers'),
  getProviderModels: (provider) => api.get(`/providers/${provider}/models`),
  getHuggingFaceModels: () => api.get('/providers/huggingface/models'),
  getOpenRouterModels: () => api.get('/providers/openrouter/models'),

  // Conversations
  getConversations: () => api.get('/conversations'),
  getConversation: (id) => api.get(`/conversations/${id}`),
  createConversation: (data) => api.post('/conversations', data),
  updateConversation: (id, data) => api.patch(`/conversations/${id}`, data),
  deleteConversation: (id) => api.delete(`/conversations/${id}`),
  getMessages: (conversationId) => api.get(`/conversations/${conversationId}/messages`),
  searchConversations: (q) => api.get('/conversations/search', { params: { q } }),

  // Chat Endpoints
  sendChatMessage: ({ provider, model, conversationId, message }) =>
    api.post('/chat', { provider, model, conversationId, message }),

  sendProviderChat: (provider, { model, conversationId, message }) =>
    api.post(`/chat/${provider}`, { model, conversationId, message }),
};

export default apiService;
