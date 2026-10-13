# API Bağlantı Ayarları - Expo Go için

## Sorun

Expo Go'da "Network request failed" hatası alıyorsanız, bu mobil cihazın `localhost` adresine erişememesinden kaynaklanır. Mobil cihazlar `localhost`'u kendi cihazlarını işaret eder, bilgisayarınızı değil.

## Çözüm

### Adım 1: Bilgisayarınızın IP Adresini Bulun

**Windows:**
```powershell
ipconfig
```
Çıktıda `IPv4 Address` satırını bulun (örnek: `192.168.1.100`)

**Mac/Linux:**
```bash
ifconfig
# veya
ip addr
```

**Alternatif:** Expo Go terminalinde çalıştığınızda, QR kodun yanında IP adresi gösterilir (örnek: `exp://192.168.1.100:8081`)

### Adım 2: API Config Dosyasını Güncelleyin

`mobile-app/src/config/apiConfig.ts` dosyasını açın ve `DEVICE_IP` değişkenini bulun:

```typescript
const DEVICE_IP = '192.168.1.100'; // Buraya bilgisayarınızın IP'sini yazın
```

Kendi IP adresinizle değiştirin:
```typescript
const DEVICE_IP = '192.168.1.50'; // Örnek: Sizin IP'niz
```

### Adım 3: Expo Go'yu Yeniden Başlatın

1. Expo Go uygulamasını kapatın
2. Terminalde `npx expo start --clear` komutunu çalıştırın
3. Expo Go'yu tekrar açın ve QR kodu tarayın

## Otomatik Algılama (Deneysel)

API config dosyası, Expo'nun sağladığı debugger host bilgisini otomatik olarak kullanmayı dener. Eğer çalışmazsa, yukarıdaki manuel yöntemi kullanın.

## Environment Variable (Alternatif)

Eğer IP adresini kodda saklamak istemiyorsanız, `.env` dosyası oluşturabilirsiniz:

```bash
# mobile-app/.env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api
```

⚠️ **Not:** `.env` dosyasını `.gitignore`'a eklemeyi unutmayın!

## Backend CORS Ayarları

Backend otomatik olarak development modunda tüm local network IP'lerine izin verir. Eğer sorun devam ederse:

1. Backend'in çalıştığından emin olun (`npm start` veya `node server.js`)
2. Backend'in port 3000'de dinlediğini kontrol edin
3. Firewall'ın port 3000'i engellemediğinden emin olun

## Test

Ayarları yaptıktan sonra, Expo Go konsolunda şu mesajı görmelisiniz:

```
🔗 API Base URL (ios): http://192.168.1.100:3000/api
```

veya

```
🔗 API Base URL (android): http://192.168.1.100:3000/api
```

Eğer hala `localhost` görüyorsanız, IP adresini doğru girdiğinizden emin olun.

## Sorun Giderme

### Hata: "Network request failed"

- ✅ IP adresinin doğru olduğundan emin olun
- ✅ Backend'in çalıştığından emin olun
- ✅ Bilgisayar ve telefon aynı WiFi ağında mı kontrol edin
- ✅ Firewall ayarlarını kontrol edin

### Hata: "CORS policy error"

- ✅ Backend'in development modunda çalıştığından emin olun
- ✅ `backend/src/server.js` dosyasındaki CORS ayarlarını kontrol edin

