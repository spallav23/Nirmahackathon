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

// Verification & Password Resets
export const verifyEmail = (token) => api.post('/auth/verify-email', { token });
export const resendVerification = (email) => api.post('/auth/resend-verification', { email });
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const resetPassword = (token, newPassword) => api.post('/auth/reset-password', { token, newPassword });
export const verifyEmailDev = (email) => api.get(`/auth/verify-email-dev/${email}`);

// ML Config APIs
export const getModels = () => api.get('/ml/models');
export const setActiveModel = (model_id) => api.post('/ml/models/active', { model_id });
export const trainModel = (formData) => api.post('/ml/train', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getTrainProgress = () => api.get('/ml/train/progress');
export const scheduleInspection = (data) => api.post('/ml/schedule-inspection', data);
export const getDatasetSummary = () => api.get('/ml/dataset/summary');
export const getInverterIds = () => api.get('/ml/dataset/inverters');
export const getInverterRawHistory = (id, limit = 50) => api.get(`/ml/dataset/inverters/${id}?limit=${limit}`);

// History / Prediction APIs
export const getHistory = () => api.get('/history');
export const getHistoryById = (id) => api.get(`/history/${id}`);
export const getAnalytics = () => api.get('/history/analytics');
export const getLatestPerInverter = () => api.get('/history/inverters/latest');
export const runPrediction = (predictionData) => api.post('/ml/predict', predictionData);

// Summarization (AI/LLM) APIs
// Assuming summary is the endpoint for LLM explanation as found in summaryRoutes.js
export const getAISummary = (summaryData) => api.post('/summary', summaryData);
export const sendChatMessage = (chatData) => api.post('/summary/chat', chatData);

// API Key Management
export const generateApiKey = () => api.post('/api-key/generate');
export const getApiKey = () => api.get('/api-key');
export const revokeApiKey = () => api.delete('/api-key');
export const getApiPredictions = (page = 1) => api.get(`/api-key/predictions?page=${page}&limit=20`);

export default api;
