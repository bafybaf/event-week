# Çözüm Stratejileri - Event Week Mobile App

## Sorun Özeti

**Hata**: `(0 , react_1.use) is not a function`
- `expo-router` 5.0.7 React 19'un `use` hook'unu kullanıyor
- Proje React 18.2.0 kullanıyor
- React 18'de `use` hook'u yok

## Çözüm Stratejileri

### Strateji 1: expo-router 4.x + React 18 (ÖNERİLEN - ŞU AN AKTİF)

**Durum**: ✅ Uygulandı
- `expo-router`: ~4.0.21 (React 18 uyumlu)
- `react`: 18.2.0
- `react-dom`: 18.2.0

**Avantajlar**:
- React Native 0.76.5 ile tam uyumlu
- Stabil ve test edilmiş sürüm kombinasyonu
- En az riskli çözüm

**Dezavantajlar**:
- expo-router'ın yeni özelliklerini kullanamazsınız

### Strateji 2: React 19 + expo-router 5.x (DENENEBİLİR)

**Gereksinimler**:
1. React 19.0.0'a yükselt
2. React-dom 19.0.0'a yükselt
3. expo-router'ı 5.x'e geri yükselt

**Uyarı**: React Native 0.76.5 React 18 gerektirebilir. Bu yüzden React 19 ile uyumluluğu kontrol edilmeli.

**Package.json değişiklikleri**:
```json
{
  "react": "19.0.0",
  "react-dom": "19.0.0",
  "expo-router": "~5.0.0"
}
```

### Strateji 3: Web için 'use' Hook Polyfill (Hazır)

**Durum**: ✅ Dosya oluşturuldu (`react-use-polyfill.web.js`)

**Nasıl Çalışır**:
- Web platformunda React'in `use` hook'unu polyfill eder
- expo-router 5.x'in web'de çalışmasını sağlar
- Native platformlarda etkisiz (zaten gerek yok)

**Kullanım**:
- Metro otomatik olarak `.web.js` uzantılı dosyaları algılar
- Web platformunda otomatik kullanılır

**Not**: Bu polyfill expo-router'ın internal kullanımı için gerekli. Manuel olarak import etmeye gerek yok.

### Strateji 4: Metro Yapılandırması Optimizasyonu

**Durum**: ✅ Güncellendi (`metro.config.js`)

**Yapılan iyileştirmeler**:
- Web platformu resolver ayarları eklendi
- Platform-specific dosya algılama aktif
- `.web.js` uzantılı dosyalar otomatik algılanır

## Mevcut Yapılandırma

### Package.json Özeti
```json
{
  "expo": "^54.0.21",
  "react": "18.2.0",
  "react-dom": "18.2.0",
  "react-native": "0.76.5",
  "expo-router": "~4.0.21",
  "react-native-reanimated": "~4.1.1"
}
```

### Yapılandırma Dosyaları
- ✅ `babel.config.js` - react-native-reanimated plugin eklendi
- ✅ `metro.config.js` - Web platformu desteği eklendi
- ✅ `react-native-worklets.web.js` - Web mock'u mevcut
- ✅ `react-use-polyfill.web.js` - use hook polyfill eklendi

## Önerilen Adımlar

### 1. Şu An Aktif Çözümü Test Edin

```bash
cd mobile-app
rm -rf node_modules package-lock.json
npm install
npx expo start --clear
```

### 2. Eğer Sorun Devam Ederse

#### Seçenek A: Polyfill'i Aktif Et (expo-router 5.x için)

`package.json`'da expo-router'ı 5.x'e yükselt:
```json
"expo-router": "~5.0.0"
```

Polyfill otomatik olarak web'de kullanılacak.

#### Seçenek B: React 19'a Yükselt (Dikkatli!)

```bash
npm install react@19.0.0 react-dom@19.0.0
npm install expo-router@~5.0.0
```

**Uyarı**: React Native 0.76.5 ile uyumluluğu kontrol edin!

## Sorun Giderme

### Metro Cache Sorunları
```bash
npx expo start --clear
```

### Node Modules Temizleme
```bash
rm -rf node_modules package-lock.json
npm install
```

### Platform-Specific Sorunlar
- Web: `.web.js` dosyaları kullanılır
- iOS/Android: Normal dosyalar kullanılır

## Notlar

1. **Expo SDK 54**: React 18 veya 19'u destekler (* peer dependency)
2. **React Native 0.76.5**: React 18.2.0 gerektirir
3. **expo-router 4.x**: React 18 ile tam uyumlu
4. **expo-router 5.x**: React 19'un `use` hook'unu gerektirir

## En Güvenli Yol

**Şu an aktif olan çözümü (Strateji 1) kullanın:**
- expo-router 4.0.21
- React 18.2.0
- React-dom 18.2.0

Bu kombinasyon en stabil ve test edilmiş çözümdür.

