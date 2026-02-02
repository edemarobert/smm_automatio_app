import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const authAPI = {
  login: (email, password) => 
    axios.post(`${API_URL}/auth/login`, { email, password }),
  
  signup: (fullName, email, password) => 
    axios.post(`${API_URL}/auth/register`, { fullName, email, password }),
  
  getMe: (token) => 
    axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
};

export const postsAPI = {
  create: (data, token) => {
    // Check if data is FormData (for file uploads)
    if (data instanceof FormData) {
      return axios.post(`${API_URL}/posts`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
    }
    // Regular JSON data
    return axios.post(`${API_URL}/posts`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  
  getAll: (params, token) =>
    axios.get(`${API_URL}/posts`, { params, headers: { Authorization: `Bearer ${token}` } }),
  
  getOne: (id, token) =>
    axios.get(`${API_URL}/posts/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  
  update: (id, data, token) =>
    axios.put(`${API_URL}/posts/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  
  delete: (id, token) =>
    axios.delete(`${API_URL}/posts/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  
  publish: (id, token) =>
    axios.post(`${API_URL}/posts/${id}/publish`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
};

export const accountsAPI = {
  create: (data, token) =>
    axios.post(`${API_URL}/accounts`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  
  getAll: (token) =>
    axios.get(`${API_URL}/accounts`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  
  getOne: (id, token) =>
    axios.get(`${API_URL}/accounts/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  
  update: (id, data, token) =>
    axios.put(`${API_URL}/accounts/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  
  delete: (id, token) =>
    axios.delete(`${API_URL}/accounts/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
};

export const analyticsAPI = {
  getDashboardStats: (token) =>
    axios.get(`${API_URL}/analytics/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  
  getPeriodAnalytics: (params, token) =>
    axios.get(`${API_URL}/analytics/period`, { params, headers: { Authorization: `Bearer ${token}` } }),
  
  getTopPosts: (params, token) =>
    axios.get(`${API_URL}/analytics/top-posts`, { params, headers: { Authorization: `Bearer ${token}` } }),
  
  getPlatformStats: (token) =>
    axios.get(`${API_URL}/analytics/platform-stats`, {
      headers: { Authorization: `Bearer ${token}` }
    })
};

export const settingsAPI = {
  getSettings: (token) =>
    axios.get(`${API_URL}/settings`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  
  updateSettings: (data, token) =>
    axios.put(`${API_URL}/settings`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  
  changePassword: (data, token) =>
    axios.post(`${API_URL}/settings/change-password`, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
};

export const notificationsAPI = {
  getAll: (params, token) =>
    axios.get(`${API_URL}/notifications`, {
      params,
      headers: { Authorization: `Bearer ${token}` }
    }),

  getUnreadCount: (token) =>
    axios.get(`${API_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  markRead: (id, token) =>
    axios.put(`${API_URL}/notifications/${id}/read`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  markAllRead: (token) =>
    axios.put(`${API_URL}/notifications/read-all`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  delete: (id, token) =>
    axios.delete(`${API_URL}/notifications/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
};

export const oauthAPI = {
  getTwitterAuthUrl: (token) =>
    axios.get(`${API_URL}/oauth/twitter/auth-url`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  handleTwitterCallback: (code, codeVerifier, state, token) =>
    axios.post(`${API_URL}/oauth/twitter/callback`, { code, codeVerifier, state }, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getFacebookAuthUrl: (token) =>
    axios.get(`${API_URL}/oauth/facebook/auth-url`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  handleFacebookCallback: (code, token) =>
    axios.post(`${API_URL}/oauth/facebook/callback`, { code }, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getLinkedInAuthUrl: (token) =>
    axios.get(`${API_URL}/oauth/linkedin/auth-url`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  handleLinkedInCallback: (code, token) =>
    axios.post(`${API_URL}/oauth/linkedin/callback`, { code }, {
      headers: { Authorization: `Bearer ${token}` }
    })
};
