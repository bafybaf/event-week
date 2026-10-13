# Deprecation Uyarıları - Çözüm Rehberi

## Uyarılar

1. `"shadow*" style props are deprecated. Use "boxShadow"` 
2. `props.pointerEvents is deprecated. Use style.pointerEvents`
3. `Cannot record touch end without a touch start`

## Durum

Bu uyarılar **kritik değil** ve uygulamanın çalışmasını engellemez. Ancak gelecekte kaldırılabilir, bu yüzden düzeltmek iyi olur.

## Kaynak

Bu uyarılar genellikle şu kaynaklardan gelir:
- `react-navigation` paketleri (expo-router kullanıyor)
- `react-native-web` paketinin eski API'leri
- Proje kodunuzdaki shadow* style kullanımları

## Çözüm

### Otomatik Çözüm (Önerilmez)

Bu uyarılar büyük ölçüde third-party paketlerden geliyor. Kendi kodunuzu güncelleyebilirsiniz ama paketlerin uyarılarını gideremezsiniz.

### Manuel Düzeltme

Kendi kodunuzdaki shadow* kullanımlarını `boxShadow`'a dönüştürebilirsiniz:

**Eski (Deprecated):**
```javascript
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.1,
shadowRadius: 3.84,
elevation: 5,
```

**Yeni (Web için):**
```javascript
// Platform-specific style
...(Platform.OS === 'web' && {
  boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.1)',
}),
// Native için eski shadow props kalabilir
...(Platform.OS !== 'web' && {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 3.84,
  elevation: 5,
}),
```

### Geçici Çözüm: Uyarıları Gizle

Metro bundler'da uyarıları gizleyebilirsiniz (önerilmez, sadece geçici):

```javascript
// metro.config.js
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};
```

## Not

Bu uyarılar Expo Go'da sorun yaratmaz. Çoğunlukla `react-navigation` ve `react-native-web` paketlerinden geliyor ve paket güncellemeleriyle düzelecektir.

## Öncelik

1. ✅ Mobildeki `PlatformConstants` hatasını çöz
2. ⚠️ Deprecation uyarıları (opsiyonel, kritik değil)

