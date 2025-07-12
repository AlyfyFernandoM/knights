// Configuração da API
const API_BASE_URL = 'http://localhost:3001/api';

// Função para fazer requisições à API
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('authToken');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro na requisição');
    }

    return data;
  } catch (error) {
    console.error('Erro na API:', error);
    throw error;
  }
}

// Funções de autenticação
export const auth = {
  async register(userData) {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async login(email, password) {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  async getProfile() {
    return apiRequest('/auth/profile');
  },

  async updateProfile(profileData) {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  }
};

// Funções para prestadoras
export const providers = {
  async getAll() {
    return apiRequest('/providers');
  },

  async like(providerId) {
    return apiRequest('/providers/like', {
      method: 'POST',
      body: JSON.stringify({ providerId })
    });
  },

  async getLiked() {
    return apiRequest('/providers/liked');
  },

  async getLikedBy() {
    return apiRequest('/providers/liked-by');
  }
};

// Funções para notícias
export const news = {
  async getAll() {
    return apiRequest('/news');
  }
};

// Função para verificar se o usuário está logado
export function isAuthenticated() {
  return !!localStorage.getItem('authToken');
}

// Função para obter dados do usuário do localStorage
export function getUserData() {
  const userData = localStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
}

// Função para salvar dados do usuário
export function saveUserData(userData) {
  localStorage.setItem('userData', JSON.stringify(userData));
}

// Função para salvar token
export function saveAuthToken(token) {
  localStorage.setItem('authToken', token);
}