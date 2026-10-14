import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService';
import { getIntroTheme, isFilliBoyaEvent, type IntroTheme } from '../../constants/matrix';

function toDateOnly(value: any): string {
  if (value == null || value === '') return '';
  if (typeof value === 'string') {
    const ymd = value.trim().match(/^(\d{4}-\d{2}-\d{2})/);
    if (ymd) return ymd[1];
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  try {
    return date.toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

export const mapEventFromApi = (event: any) => {
  if (!event) return null;
  return {
    id: event.id?.toString() || String(event.id),
    name: event.name || 'Etkinlik',
    description: event.description || '',
    date: toDateOnly(event.startDate || event.start_date || event.date),
    location: event.location || event.city || '',
    password: '',
    isActive: event.status === 'active' || event.status === 'published' || event.isActive !== false,
    image: event.coverImage || event.cover_image || '',
    logo: event.logo || '',
    appLogo: event.appLogo || event.app_logo || '',
    introVideoUrl: event.introVideoUrl || event.intro_video_url || '',
  };
};

export function formatPersonName(user?: any, fallback = 'Katılımcı') {
  if (!user) return fallback;
  const first = String(user.firstName || user.first_name || '').trim();
  const last = String(user.lastName || user.last_name || '').trim();
  return `${first} ${last}`.trim() || fallback;
}

export function mapUserFromApi(user?: any) {
  if (!user) return null;
  return {
    ...user,
    firstName: user.firstName || user.first_name || '',
    lastName: user.lastName || user.last_name || '',
    profileImage: user.profileImage || user.profile_image || null,
  };
}

export async function refreshSelectedEvent() {
  const stored = await AsyncStorage.getItem('selectedEvent');
  if (!stored) return null;

  let current: any = null;
  try {
    current = JSON.parse(stored);
  } catch {
    return null;
  }

  if (!current?.id) return current;

  let fresh: any = null;
  try {
    const events = await apiService.getPublicEvents();
    const list = Array.isArray(events) ? events : [];
    fresh = list.find((item: any) => String(item.id) === String(current.id));
  } catch {
    fresh = null;
  }

  if (!fresh) {
    try {
      fresh = await apiService.getEvent(current.id);
    } catch {
      fresh = null;
    }
  }

  if (!fresh) return current;

  try {
    const mapped = {
      ...current,
      ...mapEventFromApi(fresh),
      id: String(current.id),
    };
    await AsyncStorage.setItem('selectedEvent', JSON.stringify(mapped));
    return mapped;
  } catch {
    return current;
  }
}

export async function loadLoginEvent() {
  try {
    const events = await apiService.getPublicEvents();
    const list = Array.isArray(events) ? events : [];
    const mapped = list.map(mapEventFromApi).filter(Boolean) as NonNullable<ReturnType<typeof mapEventFromApi>>[];
    return mapped.find((event) => !!event.logo) || mapped[0] || null;
  } catch {
    return null;
  }
}

export async function loadAppLogo() {
  try {
    const response = await apiService.getPublicAppLogo();
    return response || null;
  } catch {
    return null;
  }
}

export async function loadAppIntroVideo() {
  try {
    const url = await apiService.getPublicAppIntroVideo();
    return url || null;
  } catch {
    return null;
  }
}

export async function loadWelcomeIntroState(): Promise<{
  displayName: string;
  eventName: string;
  logoUrl: string;
  videoUrl: string;
  theme: IntroTheme;
}> {
  const eventRaw = await AsyncStorage.getItem('selectedEvent');
  const userRaw = await AsyncStorage.getItem('currentUser');
  const cachedEvent = eventRaw ? JSON.parse(eventRaw) : null;
  const event = (await refreshSelectedEvent()) || cachedEvent;
  const user = userRaw ? JSON.parse(userRaw) : null;
  const theme = getIntroTheme(event);
  const eventVideo = event?.introVideoUrl || event?.intro_video_url || '';
  let videoUrl = eventVideo;
  if (!videoUrl && isFilliBoyaEvent(event)) {
    videoUrl = (await loadAppIntroVideo()) || '';
  }

  return {
    displayName: formatPersonName(user),
    eventName: event?.name || '',
    logoUrl: event?.logo || event?.appLogo || '',
    videoUrl,
    theme,
  };
}
