import { BackHandler, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import notificationService from '../services/notificationService';

type ResetFn = () => void;
let resetRoot: ResetFn | null = null;

export function registerLogoutReset(reset: ResetFn) {
  resetRoot = reset;
}

export function leaveToLogin() {
  try {
    if (resetRoot) resetRoot();
    else router.replace('/');
  } catch {
    router.replace('/');
  }
}

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
    if (resetRoot) resetRoot();
    else router.replace('/');
  } catch {
    try {
      router.replace('/');
    } catch {
      // ignore
    }
  }

  if (Platform.OS === 'android') {
    setTimeout(() => BackHandler.exitApp(), 80);
  }
}
