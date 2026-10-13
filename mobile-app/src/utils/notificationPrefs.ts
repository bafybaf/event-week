import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService';

export type NotificationPrefs = {
  notificationsEnabled: boolean;
  notifyAnnouncements: boolean;
  notifyProgram: boolean;
  notifyAppointments: boolean;
  notifySupport: boolean;
  notifyVoting: boolean;
  notifyDocuments: boolean;
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  notificationsEnabled: true,
  notifyAnnouncements: true,
  notifyProgram: true,
  notifyAppointments: true,
  notifySupport: true,
  notifyVoting: true,
  notifyDocuments: true,
};

export async function loadNotificationPrefs(): Promise<NotificationPrefs> {
  try {
    const userJson = await AsyncStorage.getItem('currentUser');
    const user = userJson ? JSON.parse(userJson) : {};
    return { ...DEFAULT_NOTIFICATION_PREFS, ...(user.preferences || {}) };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
}

export async function saveNotificationPrefs(
  partial: Partial<NotificationPrefs>
): Promise<NotificationPrefs> {
  const current = await loadNotificationPrefs();
  const next = { ...current, ...partial };

  const token = await AsyncStorage.getItem('token');
  const userJson = await AsyncStorage.getItem('currentUser');
  const user = userJson ? JSON.parse(userJson) : {};

  if (user.id && token && token !== 'dev') {
    try {
      await apiService.put(`/users/${user.id}`, { preferences: next });
    } catch (error) {
      console.log('Notification prefs sync error:', error);
    }
  }

  await AsyncStorage.setItem(
    'currentUser',
    JSON.stringify({ ...user, preferences: next })
  );
  return next;
}
