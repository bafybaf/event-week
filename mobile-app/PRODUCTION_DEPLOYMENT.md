# Production Deployment Rehberi

## Expo Uygulaması Production'a Hazırlama

### 1. API URL Yapılandırması

Production için API URL'ini ayarlayın:

**Yöntem 1: Environment Variable (Önerilen)**

1. `mobile-app` klasöründe `.env` dosyası oluşturun:
```env
EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api
```

2. `src/config/apiConfig.ts` dosyasında production URL'i güncelleyin:
```typescript
const productionUrl = 'https://api.yourdomain.com/api'; // Production URL'inizi buraya yazın
```

**Yöntem 2: Build Sırasında**

EAS Build kullanıyorsanız:
```bash
eas build --platform android --profile production --env EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api
```

### 2. Expo Image Picker - Production Uyarıları

✅ **Sorun Yok**: `expo-image-picker` production'da sorunsuz çalışır.

- Deprecated uyarısı sadece development'ta görünür
- Production build'de uyarı görünmez
- Tüm platformlarda (iOS, Android, Web) çalışır

### 3. Android Build

```bash
# Android APK/AAB oluşturma
eas build --platform android --profile production

# Veya lokal build
cd mobile-app
npx expo run:android --variant release
```

**Gereksinimler:**
- Android Studio kurulu olmalı
- Java JDK kurulu olmalı
- Android SDK yapılandırılmış olmalı

### 4. iOS Build

```bash
# iOS build (sadece Mac'te)
eas build --platform ios --profile production

# Veya lokal build
cd mobile-app
npx expo run:ios --configuration Release
```

**Gereksinimler:**
- macOS gereklidir
- Xcode kurulu olmalı
- Apple Developer hesabı gereklidir

### 5. App Store / Play Store Yayınlama

**Android (Play Store):**
1. `eas build --platform android --profile production` ile AAB oluşturun
2. Google Play Console'a giriş yapın
3. Yeni uygulama oluşturun veya mevcut uygulamayı seçin
4. AAB dosyasını yükleyin
5. Store listing bilgilerini doldurun
6. Yayınlayın

**iOS (App Store):**
1. `eas build --platform ios --profile production` ile IPA oluşturun
2. App Store Connect'e giriş yapın
3. Yeni uygulama oluşturun veya mevcut uygulamayı seçin
4. IPA dosyasını yükleyin (Transporter veya Xcode ile)
5. App Store listing bilgilerini doldurun
6. Review için gönderin

### 6. Önemli Notlar

**Backend URL:**
- ✅ Production'da mutlaka HTTPS kullanın
- ✅ CORS ayarlarını production domain'inize göre yapın
- ✅ API rate limiting ekleyin

**Güvenlik:**
- ✅ API token'ları güvenli şekilde saklayın (AsyncStorage)
- ✅ HTTPS zorunlu
- ✅ Certificate pinning düşünün (büyük uygulamalar için)

**Performans:**
- ✅ Production build'de optimizasyonlar otomatik yapılır
- ✅ Image picker native modülleri production'da daha hızlı çalışır

### 7. Test Checklist

Production'a çıkmadan önce:
- [ ] API URL production'a işaret ediyor
- [ ] Profil resmi yükleme çalışıyor
- [ ] Tüm API endpoint'leri test edildi
- [ ] Android ve iOS'ta test edildi
- [ ] Network hataları düzgün handle ediliyor
- [ ] Loading state'leri çalışıyor

### 8. Troubleshooting

**Network Request Failed:**
- Backend sunucusunun çalıştığından emin olun
- API URL'inin doğru olduğunu kontrol edin
- CORS ayarlarını kontrol edin
- Firewall ayarlarını kontrol edin

**Image Picker Çalışmıyor:**
- İzinlerin verildiğinden emin olun
- Platform-specific kodları kontrol edin

