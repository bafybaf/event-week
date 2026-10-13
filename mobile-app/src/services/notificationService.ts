import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { API_BASE_URL } from '../config/apiConfig';

const isExpoGo = Constants.executionEnvironment === 'storeClient';
const CHANNEL_ID = 'event-week';

let Notifications: any = null;
if (!isExpoGo && Platform.OS !== 'web') {
  try {
    const notificationsModule = require('expo-notifications');
    Notifications = notificationsModule;

    if (Notifications && Notifications.setNotificationHandler) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    }
  } catch (error) {
    console.log('expo-notifications not available');
  }
}

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
  sound?: boolean;
  priority?: 'min' | 'low' | 'default' | 'high' | 'max';
  badge?: number;
}

export type NotificationRoute = {
  pathname: string;
  params?: Record<string, string>;
};

export function getRouteFromNotificationData(data: any): NotificationRoute | null {
  if (!data) return null;

  if (data.ticketId) {
    return { pathname: '/support-detail', params: { id: String(data.ticketId) } };
  }
  if (data.appointmentId) {
    return {
      pathname: '/appointment-details',
      params: { appointmentId: String(data.appointmentId) },
    };
  }
  if (data.screen) {
    return { pathname: String(data.screen) };
  }

  switch (data.type) {
    case 'announcement':
      return { pathname: '/announcements' };
    case 'voting':
      return { pathname: '/voting' };
    case 'appointment':
      return { pathname: '/appointments' };
    case 'transfer':
      return { pathname: '/transfers' };
    case 'activity':
      return { pathname: '/activities' };
    case 'document':
      return { pathname: '/documents' };
    case 'survey':
      return { pathname: '/surveys' };
    case 'quiz':
      return { pathname: '/quiz' };
    case 'flight':
      return { pathname: '/flights' };
    case 'support':
      return { pathname: '/support' };
    case 'program':
      return { pathname: '/(tabs)/program' };
    default:
      return null;
  }
}

const getProjectId = (): string | undefined =>
  Constants.easConfig?.projectId ||
  Constants.expoConfig?.extra?.eas?.projectId;

class NotificationService {
  private expoPushToken: string | null = null;
  private registering = false;

  isAvailable(): boolean {
    return !!Notifications && Platform.OS !== 'web';
  }

  async setupAndroidChannel(): Promise<void> {
    if (!Notifications || Platform.OS !== 'android') return;
    try {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Event Week',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2BB6E8',
        sound: 'default',
        enableVibrate: true,
      });
    } catch (error) {
      console.log('Android notification channel error:', error);
    }
  }

  async initialize(): Promise<string | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      if (!Device.isDevice) {
        console.log('Must use physical device for Push Notifications');
        return null;
      }

      await this.setupAndroidChannel();

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission not granted');
        return null;
      }

      const projectId = getProjectId();
      if (!projectId) {
        console.log('EAS projectId missing, cannot fetch Expo push token');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      this.expoPushToken = token?.data || null;

      if (this.expoPushToken) {
        await AsyncStorage.setItem('expoPushToken', this.expoPushToken);
      }

      return this.expoPushToken;
    } catch (error) {
      console.log('Error initializing notifications:', error);
      return null;
    }
  }

  async registerPushToken(): Promise<string | null> {
    if (this.registering || Platform.OS === 'web') {
      return this.expoPushToken;
    }

    const authToken = await AsyncStorage.getItem('token');
    if (!authToken) {
      return null;
    }

    this.registering = true;
    try {
      const token = this.expoPushToken || (await this.initialize());
      if (!token) {
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/notifications/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ pushToken: token }),
      });

      if (!response.ok) {
        console.log('Push token register failed:', response.status);
      }

      return token;
    } catch (error) {
      console.log('Push token register error:', error);
      return null;
    } finally {
      this.registering = false;
    }
  }

  async unregisterPushToken(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      const authToken = await AsyncStorage.getItem('token');
      if (authToken) {
        await fetch(`${API_BASE_URL}/notifications/remove-token`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
      }
    } catch (error) {
      console.log('Push token remove error:', error);
    } finally {
      this.expoPushToken = null;
      await AsyncStorage.removeItem('expoPushToken');
    }
  }

  async getStoredToken(): Promise<string | null> {
    try {
      return this.expoPushToken || (await AsyncStorage.getItem('expoPushToken'));
    } catch (error) {
      return null;
    }
  }

  addNotificationListener(handler: (notification: any) => any): any {
    if (!Notifications) {
      return { remove: () => {} };
    }
    return Notifications.addNotificationReceivedListener(handler);
  }

  addNotificationResponseListener(handler: (response: any) => any): any {
    if (!Notifications) {
      return { remove: () => {} };
    }
    return Notifications.addNotificationResponseReceivedListener(handler);
  }

  async getLastNotificationResponse(): Promise<any> {
    if (!Notifications?.getLastNotificationResponseAsync) {
      return null;
    }
    try {
      return await Notifications.getLastNotificationResponseAsync();
    } catch (error) {
      return null;
    }
  }

  removeNotificationListener(subscription: any): void {
    if (!Notifications || !subscription) {
      return;
    }
    if (typeof subscription.remove === 'function') {
      subscription.remove();
      return;
    }
    Notifications.removeNotificationSubscription?.(subscription);
  }

  async getPermissionsStatus(): Promise<any> {
    if (!Notifications) {
      return { status: 'undetermined' };
    }
    return await Notifications.getPermissionsAsync();
  }

  async requestPermissions(): Promise<any> {
    if (!Notifications) {
      return { status: 'undetermined' };
    }
    return await Notifications.requestPermissionsAsync();
  }

  async sendLocalNotification(notification: NotificationData): Promise<void> {
    if (!Notifications) return;
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: notification.sound !== false,
          priority: notification.priority || 'default',
          badge: notification.badge,
        },
        trigger: null,
      });
    } catch (error) {
      console.log('Error sending local notification:', error);
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
