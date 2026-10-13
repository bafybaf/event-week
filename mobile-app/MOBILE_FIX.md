# Mobil Platform Hatası - Çözüm Rehberi

## Sorun
Expo Go'da `PlatformConstants` modülü bulunamıyor hatası. Bu genellikle sürüm uyumsuzluklarından kaynaklanır.

## Yapılan Düzeltmeler

1. ✅ `newArchEnabled: false` yapıldı (Expo Go uyumluluğu için)
2. ✅ `expo-router` sürümü güncellendi (4.0.21 → 5.0.0)
3. ✅ Eksik icon dosyaları app.json'dan kaldırıldı

## Çözüm Adımları

### 1. Paketleri Expo SDK 54 ile Uyumlu Hale Getir

Terminalde şu komutu çalıştırın:

```bash
cd mobile-app
npx expo install --fix
```

Bu komut tüm Expo paketlerini SDK 54 ile uyumlu sürümlere güncelleyecektir.

### 2. Node Modules ve Cache Temizle

```bash
cd mobile-app
rm -rf node_modules package-lock.json .expo
npm install
```

### 3. Expo'yu Cache Temizleyerek Başlat

```bash
npx expo start --clear
```

## Alternatif Çözüm: Development Build

Eğer Expo Go ile çalışmıyorsa, development build oluşturun:

```bash
cd mobile-app
npx expo install expo-dev-client
npx expo prebuild --clean
npx expo run:android  # veya npx expo run:ios
```

## Notlar

- Expo Go bazı native modülleri desteklemez
- Development build oluşturmak daha fazla özellik sağlar
- Web platformu sorunsuz çalışıyor

