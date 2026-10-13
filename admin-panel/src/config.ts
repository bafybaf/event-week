function normalizeOrigin(raw?: string) {
  return String(raw || 'http://localhost:3000')
    .trim()
    .replace(/\/api\/?$/, '')
    .replace(/\/$/, '');
}

export function getApiOrigin() {
  if (typeof window !== 'undefined') {
    const runtime = String(window.__API_ORIGIN__ || '').trim();
    if (runtime) return normalizeOrigin(runtime);
  }
  const fromEnv = String(process.env.REACT_APP_API_URL || '').trim();
  if (fromEnv) return normalizeOrigin(fromEnv);
  if (typeof window !== 'undefined' && window.location?.origin) {
    return normalizeOrigin(window.location.origin);
  }
  return 'http://localhost:3000';
}

export const API_ORIGIN = getApiOrigin();
export const API_BASE_URL = `${API_ORIGIN}/api`;

export function fileUrl(url?: string | null) {
  if (!url) return '';
  const value = String(url);
  const uploadsIndex = value.indexOf('/uploads/');
  if (uploadsIndex !== -1) {
    return `${API_ORIGIN}${value.slice(uploadsIndex)}`;
  }
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
      .replace('http://localhost:3000', API_ORIGIN)
      .replace('http://localhost:3001', API_ORIGIN)
      .replace('http://127.0.0.1:3000', API_ORIGIN)
      .replace('http://127.0.0.1:3001', API_ORIGIN);
  }
  return `${API_ORIGIN}/${value.replace(/^\//, '')}`;
}

declare global {
  interface Window {
    __API_ORIGIN__?: string;
  }
}
