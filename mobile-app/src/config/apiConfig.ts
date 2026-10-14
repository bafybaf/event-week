import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * API Base URL Configuration
 * 
 * Web: localhost çalışır çünkü tarayıcı aynı makinede çalışır
 * Native (Expo Go): Bilgisayarın local IP adresini kullanmalı
 * 
 * IP adresini bulmak için:
 * - Windows: ipconfig → IPv4 Address
 * - Mac/Linux: ifconfig veya ip addr
 * - Expo Go açıkken terminalde IP gösterilir
 * 
 * ÖNEMLİ: Aşağıdaki DEVICE_IP değişkenini bilgisayarınızın local IP adresi ile değiştirin!
 * Örnek: '192.168.1.100'
 */

const PRODUCTION_API_URL = 'http://xcnmst8cowlxzcnc24jgwofs.76.13.14.253.sslip.io/api';

const getApiUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl;
  }

  const extraUrl = Constants.expoConfig?.extra?.apiUrl;
  if (typeof extraUrl === 'string' && extraUrl.length > 0) {
    return extraUrl;
  }

  return PRODUCTION_API_URL;
};

export const API_BASE_URL = getApiUrl();

/**
 * Profil resmi veya diğer asset URL'lerini düzeltir
 * Backend'den dönen localhost URL'lerini cihazın erişebileceği URL'e çevirir
 */
const getApiOrigin = (): string => API_BASE_URL.replace(/\/api\/?$/, '');

export const fixImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;

  if (url.startsWith('file://')) {
    return url;
  }

  const uploadsIndex = url.indexOf('/uploads/');
  if (uploadsIndex !== -1) {
    return `${getApiOrigin()}${url.slice(uploadsIndex)}`;
  }

  if (url.startsWith('https://')) {
    return url;
  }

  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    const path = url.replace(/https?:\/\/[^/]+/, '');
    return `${getApiOrigin()}${path}`;
  }

  if (url.startsWith('http://')) {
    return url;
  }

  if (url.startsWith('/')) {
    return `${getApiOrigin()}${url}`;
  }

  return url;
};

export function pickProfileImage(user?: {
  profileImage?: string | null;
  profile_image?: string | null;
} | null): string | null {
  return fixImageUrl(user?.profileImage || user?.profile_image || null);
}

/**
 * Doküman veya diğer dosya URL'lerini düzeltir
 * Backend'den dönen localhost URL'lerini cihazın erişebileceği URL'e çevirir
 * fixImageUrl ile aynı mantık, sadece dokümanlar için kullanılır
 */
export const fixFileUrl = (url: string | null | undefined): string | null => {
  return fixImageUrl(url); // Aynı mantık kullanılıyor
};

// Development modunda URL'yi logla
if (__DEV__) {
  console.log(`🔗 API Base URL (${Platform.OS}): ${API_BASE_URL}`);
  if (Platform.OS !== 'web' && API_BASE_URL.includes('localhost')) {
    console.error('❌ HATA: Native platform için localhost kullanılamaz!');
    console.error('💡 Çözüm: src/config/apiConfig.ts dosyasındaki DEVICE_IP değişkenini güncelleyin.');
  }
}
