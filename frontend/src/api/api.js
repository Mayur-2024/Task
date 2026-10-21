const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Beginner-friendly fetch wrapper
 * Automatically attaches JWT Authorization token and parses JSON
 */
export async function apiRequest(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

// Convenient shortcut helpers
export const api = {
  // Auth
  login: (credentials) => apiRequest('/auth/login', 'POST', credentials),
  register: (userData) => apiRequest('/auth/register', 'POST', userData),
  getMe: () => apiRequest('/auth/me', 'GET'),

  // Workspaces & Members
  getWorkspaces: () => apiRequest('/workspaces', 'GET'),
  createWorkspace: (data) => apiRequest('/workspaces', 'POST', data),
  getWorkspaceById: (id) => apiRequest(`/workspaces/${id}`, 'GET'),
  addMember: (workspaceId, data) => apiRequest(`/workspaces/${workspaceId}/members`, 'POST', data),
  removeMember: (workspaceId, memberId) => apiRequest(`/workspaces/${workspaceId}/members/${memberId}`, 'DELETE'),
  updateMemberRole: (workspaceId, memberId, data) => apiRequest(`/workspaces/${workspaceId}/members/${memberId}`, 'PATCH', data),

  // Boards
  getBoards: (workspaceId) => apiRequest(`/boards/workspace/${workspaceId}`, 'GET'),
  getBoardById: (id) => apiRequest(`/boards/${id}`, 'GET'),
  createBoard: (data) => apiRequest('/boards', 'POST', data),
  deleteBoard: (id) => apiRequest(`/boards/${id}`, 'DELETE'),
  addList: (boardId, data) => apiRequest(`/boards/${boardId}/lists`, 'POST', data),
  deleteList: (boardId, listId) => apiRequest(`/boards/${boardId}/lists/${listId}`, 'DELETE'),

  // Cards
  getCards: (boardId) => apiRequest(`/cards/board/${boardId}`, 'GET'),
  createCard: (cardData) => apiRequest('/cards', 'POST', cardData),
  moveCard: (id, moveData) => apiRequest(`/cards/${id}/move`, 'PATCH', moveData),
  updateCard: (id, updateData) => apiRequest(`/cards/${id}`, 'PATCH', updateData),
  deleteCard: (id) => apiRequest(`/cards/${id}`, 'DELETE'),

  // Messages
  getMessages: (boardId) => apiRequest(`/messages/${boardId}`, 'GET'),
  sendMessage: (msgData) => apiRequest('/messages', 'POST', msgData),
};
