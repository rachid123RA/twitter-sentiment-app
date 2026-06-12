import * as SecureStore from 'expo-secure-store';
import { API_URL } from './config';

async function getToken() {
  return SecureStore.getItemAsync('token');
}

async function request(path, options = {}) {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const url = `${API_URL}/api${path}`;
  let res;
  try {
    res = await fetch(url, { ...options, headers });
  } catch {
    throw new Error(
      `Connexion impossible à ${API_URL}. Vérifiez que Flask tourne (python app.py) et que le téléphone est sur le même Wi‑Fi.`
    );
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (body) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),
  health: () => request('/health'),
  notifications: () => request('/notifications'),
  markNotificationRead: (id) =>
    request(`/notifications/${id}/read`, { method: 'POST' }),
  predict: (tweet) =>
    request('/predictions', { method: 'POST', body: JSON.stringify({ tweet }) }),
  chat: (message, context) =>
    request('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    }),
  predictions: (page = 1) => request(`/predictions?page=${page}&limit=30`),
  predictionsAll: () => request('/predictions?page=1&limit=500'),
  dashboard: () => request('/dashboard/summary'),
  analysisDetailed: () => request('/analysis/detailed'),
  variables: () => request('/variables'),
  adminUsers: () => request('/admin/users'),
  adminPredictions: () => request('/admin/predictions'),
  adminNotifications: () => request('/admin/notifications'),
  adminCreateNotification: (title, message) =>
    request('/admin/notifications', {
      method: 'POST',
      body: JSON.stringify({ title, message }),
    }),
  adminSubscriptions: () => request('/admin/subscriptions'),
  adminUpdateSubscription: (userId, plan, is_active) =>
    request(`/admin/subscriptions/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ plan, is_active }),
    }),
};

export async function saveToken(token) {
  await SecureStore.setItemAsync('token', token);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync('token');
}
