/**
 * API client for the platform.
 * In production, requests go to the same origin (NGINX gateway); gateway routes:
 * /api/* -> main server, /ml/* -> ML server, /llm/* -> LLM service.
 */
const getBaseUrl = () => {
  if (typeof window === 'undefined') return '';
  if (process.env.REACT_APP_API_BASE) return process.env.REACT_APP_API_BASE.replace(/\/$/, '');
  const { protocol, hostname, port } = window.location;
  const portSuffix = port && port !== '80' && port !== '443' ? `:${port}` : '';
  return `${protocol}//${hostname}${portSuffix}`;
};

const api = (path, options = {}) => {
  const base = getBaseUrl();
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  return fetch(url, { ...options, headers }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);
    return data;
  });
};

export default api;

export const auth = {
  login: (email, password) => api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (body) => api('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
};

export const predictions = {
  predict: (body) => api('/api/predict', { method: 'POST', body: JSON.stringify(body) }),
  history: () => api('/api/history'),
};

export const models = {
  list: () => api('/api/models'),
};

export const chat = {
  send: (body) => api('/api/chat', { method: 'POST', body: JSON.stringify(body) }),
};

export const llm = {
  explain: (body) => api('/llm/explain', { method: 'POST', body: JSON.stringify(body) }),
  ask: (body) => api('/llm/ask', { method: 'POST', body: JSON.stringify(body) }),
};

export const health = () => api('/api/health');
