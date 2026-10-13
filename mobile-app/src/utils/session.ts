import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEYS = ['token', 'user', 'currentUser', 'selectedEvent'];

function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const padded = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = globalThis.atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string | null | undefined): boolean {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 <= Date.now() + 10_000;
}

export async function getSessionToken(): Promise<string | null> {
  const token = await AsyncStorage.getItem('token');
  if (!token || isJwtExpired(token)) return null;
  return token;
}

export async function hasValidSession(): Promise<boolean> {
  const [token, eventData, userData] = await Promise.all([
    AsyncStorage.getItem('token'),
    AsyncStorage.getItem('selectedEvent'),
    AsyncStorage.getItem('currentUser'),
  ]);
  return !!(token && eventData && userData && !isJwtExpired(token));
}

export async function clearSession() {
  await AsyncStorage.multiRemove(SESSION_KEYS);
}

export function isAuthError(error: unknown): boolean {
  const message = String((error as any)?.message || '');
  return /token expired|invalid token|no token provided|access denied/i.test(message);
}
