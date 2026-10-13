# EVENT WEEK - Kurumsal Etkinlik Uygulaması

## 📱 Proje Hakkında

EVENT WEEK, şirketlerin düzenlediği etkinliklerde katılımcı, konuşmacı ve organizasyon ekibi arasındaki etkileşimi kolaylaştıran kapsamlı bir mobil uygulama ve yönetim sistemidir.

## 🏗️ Teknik Yapı

- **Mobil Uygulama**: React Native (Expo)
- **Backend API**: Node.js + Express + PostgreSQL
- **Yönetim Paneli**: React.js Web Arayüzü
- **Dosya Yönetimi**: AWS S3 / Firebase Storage
- **Bildirimler**: Expo Push Notifications
- **Kimlik Doğrulama**: JWT
- **Veri Alma**: Excel dosyaları (xlsx modülü)

## 📁 Proje Yapısı

```
event-week-app/
├── mobile-app/          # React Native (Expo) mobil uygulama
├── backend/             # Node.js + Express API
├── admin-panel/         # React.js yönetim paneli
└── docs/               # Proje dokümantasyonu
```

## 🚀 Kurulum

### Gereksinimler
- Node.js (v16+)
- npm veya yarn
- Expo CLI
- PostgreSQL
- Git

### Mobil Uygulama Kurulumu
```bash
cd mobile-app
npm install
npx expo start
```

### Backend Kurulumu
```bash
cd backend
npm install
npm run dev
```

### Yönetim Paneli Kurulumu
```bash
cd admin-panel
npm install
npm start
```

## 📱 Mobil Uygulama Özellikleri

- 👤 **Profilim**: Katılımcı bilgileri ve QR kod
- 🔲 **QR Kodum**: Hızlı geçiş sistemi
- 🗳️ **Keypad**: Canlı oylama
- 📅 **Randevu**: Konuşmacı/katılımcı randevu sistemi
- 🗣️ **Konuşmacılar**: Konuşmacı profilleri
- 🚌 **Transfer**: Transfer seçimi
- ⏰ **Program**: Etkinlik takvimi
- 🎯 **Aktivite**: Workshop ve aktivite kayıtları
- ✈️ **Uçuş Bilgileri**: Uçuş detayları
- 🏨 **Konaklama**: Otel bilgileri
- 🖼️ **Galeri**: Fotoğraf/video paylaşımı
- 📑 **Dokümanlar**: PDF ve sunumlar
- 📝 **Notlar**: Önemli duyurular
- 📊 **Anket**: Etkinlik değerlendirmeleri
- 📣 **Duyurular**: Son dakika haberleri
- 💬 **Destek**: Canlı destek sistemi

## 🌐 Yönetim Paneli Özellikleri

- Excel dosya yükleme (katılımcı, uçuş, transfer)
- Etkinlik programı oluşturma
- Duyuru, not ve anket yönetimi
- QR kod üretimi ve takip
- Canlı oylama yönetimi
- Raporlama ve istatistikler

## 🔧 Geliştirme

### Test
```bash
# Mobil uygulama testleri
cd mobile-app
npm test

# Backend testleri
cd backend
npm test
```

### Linting
```bash
# Tüm projeler için
npm run lint
```

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 👥 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit yapın (`git commit -m 'Add some AmazingFeature'`)
4. Push yapın (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## 📞 İletişim

Proje hakkında sorularınız için issue açabilir veya iletişime geçebilirsiniz.
