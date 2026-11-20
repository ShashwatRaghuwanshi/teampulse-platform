export const API_BASE = 'http://localhost:8080/api';

class AuthStore {
  user = $state(null);
  token = $state('');

  constructor() {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('tp_user');
      const savedToken = localStorage.getItem('tp_token');
      if (savedUser && savedToken) {
        this.user = JSON.parse(savedUser);
        this.token = savedToken;
      }
    }
  }

  setSession(user, token) {
    this.user = user;
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('tp_user', JSON.stringify(user));
      localStorage.setItem('tp_token', token);
    }
  }

  logout() {
    this.user = null;
    this.token = '';
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tp_user');
      localStorage.removeItem('tp_token');
    }
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
    };
  }
}

export const auth = new AuthStore();
