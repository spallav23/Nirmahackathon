import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:80/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach JWT token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Authentication APIs
export const login = (email, password) => api.post('/auth/login', { email, password });
export const register = (userData) => api.post('/auth/register', userData);

// Profile APIs
export const getProfile = () => api.get('/profile');
export const updateProfile = (profileData) => api.put('/profile', profileData);

// Verification APIs
export const resendVerification = (email) => api.post('/auth/resend-verification', { email });

// History / Prediction APIs
export const getHistory = () => api.get('/history');
export const getHistoryById = (id) => api.get(`/history/${id}`);
export const runPrediction = (predictionData) => api.post('/predict', predictionData);

// Summarization (AI/LLM) APIs
// Assuming summary is the endpoint for LLM explanation as found in summaryRoutes.js
export const getAISummary = (summaryData) => api.post('/summary', summaryData);

export default api;
