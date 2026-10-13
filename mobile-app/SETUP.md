# Event Week Mobile App - Kurulum ve Çalıştırma

## Hızlı Başlangıç

### 1. Bağımlılıkları Yükle
```bash
cd mobile-app
npm install
```

### 2. Cache Temizle ve Başlat
```bash
# Cache temizle
npx expo start --clear

# Veya belirli bir platform için:
npx expo start --clear --web    # Web için
npx expo start --clear --android # Android için
npx expo start --clear --ios     # iOS için
```

## Yapılan Düzeltmeler

### ✅ TypeScript Yapılandırması
- `tsconfig.json`'dan `extends: "expo/tsconfig.base.json"` kaldırıldı (Expo SDK 54'te gerekli değil)

### ✅ Metro Yapılandırması
- Parent `node_modules` tamamen engellendi
- React paketleri açıkça mobile-app'in `node_modules`'üne yönlendirildi
- Web platformu için `react-native-worklets` mock'u eklendi

### ✅ Workspace Yapısı
- Root `package.json`'dan `workspaces` kaldırıldı
- Her proje bağımsız çalışıyor

### ✅ npm Yapılandırması
- `.npmrc` dosyası eklendi (hoisting devre dışı)

### ✅ Web Platformu Desteği
- `react-native-worklets.web.js` mock dosyası oluşturuldu
- Web'de worklet'ler için gerekli fonksiyonlar sağlandı

## Sorun Giderme

### React Sürüm Çakışması
Eğer hala React sürüm çakışması hatası alırsanız:
```bash
# Root'taki React paketlerini kaldırın
cd ..
Remove-Item -Recurse -Force "node_modules\react" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "node_modules\react-dom" -ErrorAction SilentlyContinue

# mobile-app'te yeniden yükleyin
cd mobile-app
npm install
```

### Metro Cache Sorunları
```bash
cd mobile-app
Remove-Item -Recurse -Force ".expo" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue
npx expo start --clear
```

### TypeScript Hataları
TypeScript sunucusunu yeniden başlatın:
- VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

## Notlar

- Web platformunda bazı Reanimated özellikleri sınırlı çalışabilir
- Tüm platformlar için aynı React sürümü kullanılıyor (React 19)
- Workspace yapısı kaldırıldı, her proje kendi bağımlılıklarını yönetiyor











