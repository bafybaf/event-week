import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as Updates from 'expo-updates';
import notificationService from '../services/notificationService';

export async function logoutAndReset() {
  try {
    await notificationService.unregisterPushToken();
  } catch {
    // Token olmasa da çıkışa devam et
  }

  try {
    await AsyncStorage.clear();
  } catch {
    // ignore
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.replace('/');
    return;
  }

  try {
    if (Updates.isEnabled) {
      await Updates.reloadAsync();
      return;
    }
  } catch {
    // Navigasyon yedeğine düş
  }

  try {
    if (typeof router.dismissTo === 'function') {
      router.dismissTo('/');
      return;
    }
  } catch {
    // ignore
  }

  try {
    router.dismissAll();
  } catch {
    // ignore
  }
  router.replace('/');
}
