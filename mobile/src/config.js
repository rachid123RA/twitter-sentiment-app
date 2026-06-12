import { Platform } from 'react-native';
import Constants from 'expo-constants';

/** Port Flask (éviter 5000 = AirPlay sur macOS) */
export const API_PORT = 5055;

/**
 * Déduit l'IP du Mac depuis Expo Go (même host que Metro).
 * Sur téléphone physique, 127.0.0.1 ne fonctionne PAS.
 */
function getDevServerHost() {
  const debuggerHost =
    Constants.expoGoConfig?.debuggerHost ??
    Constants.expoConfig?.hostUri?.replace(/^https?:\/\//, '').split('/')[0];

  if (debuggerHost) {
    return debuggerHost.split(':')[0];
  }
  return null;
}

function buildApiUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }

  const lanHost = getDevServerHost();
  if (lanHost) {
    return `http://${lanHost}:${API_PORT}`;
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${API_PORT}`;
  }
  return `http://127.0.0.1:${API_PORT}`;
}

export const API_URL = buildApiUrl();

export const COLORS = {
  Positive: '#1976D2',
  Negative: '#D32F2F',
  Neutral: '#F57C00',
  Irrelevant: '#616161',
  primary: '#1DA1F2',
  bg: '#F5F8FA',
  card: '#FFFFFF',
  text: '#14171A',
  muted: '#657786',
};
