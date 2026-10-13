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

// ⚠️ ÖNEMLİ: Bu IP adresini bilgisayarınızın local IP adresi ile değiştirin!
// Windows: ipconfig komutu ile bulabilirsiniz
// Mac/Linux: ifconfig veya ip addr komutu ile bulabilirsiniz
const DEVICE_IP = '192.168.1.100'; // Buraya bilgisayarınızın IP'sini yazın

// Environment variable'dan API URL al (varsa)
const getApiUrl = (): string => {
  // Production için environment variable'dan al (EXPO_PUBLIC_API_URL)
  // Bu değişken .env dosyasında veya build sırasında ayarlanmalı
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    console.log('🌍 Using API URL from environment:', envUrl);
    return envUrl;
  }

  // Platform kontrolü
  if (Platform.OS === 'web') {
    // Web platformu: localhost kullan
    return 'http://localhost:3000/api';
  }

  // Native platform (iOS/Android)
  // Expo Go için bilgisayarın local IP adresini kullan
  if (DEVICE_IP && DEVICE_IP !== '192.168.1.100') {
    // Manuel olarak ayarlanmış IP kullan
    return `http://${DEVICE_IP}:3000/api`;
  }

  // Expo Constants'dan debugger host bilgisini almayı dene
  // Bu genellikle Expo Go'da çalışır
  const debuggerHost = Constants.expoConfig?.hostUri || 
                       Constants.expoConfig?.extra?.debuggerHost;
  
  if (debuggerHost) {
    // Expo Go debugger host formatı: "192.168.1.100:8081"
    // Port'u 3000'e değiştir
    const [host] = debuggerHost.split(':');
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:3000/api`;
    }
  }

  // Fallback: localhost (native'de çalışmaz ama hata mesajı için)
  if (__DEV__) {
    console.warn('⚠️ API URL ayarlanmadı! DEVICE_IP değişkenini bilgisayarınızın IP adresi ile güncelleyin.');
    console.warn('📱 Expo Go terminalinde gösterilen IP adresini kullanın.');
  }
  
  // Production için: Buraya production API URL'inizi yazın
  // Örnek: 'https://api.yourdomain.com/api'
  const productionUrl = 'https://api.yourdomain.com/api'; // Production URL'inizi buraya yazın
  
  // Production build kontrolü
  if (!__DEV__ && productionUrl && productionUrl !== 'https://api.yourdomain.com/api') {
    return productionUrl;
  }
  
  return 'http://localhost:3000/api';
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
