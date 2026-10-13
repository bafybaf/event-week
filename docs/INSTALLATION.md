# Event Week - Kurulum Rehberi

## Gereksinimler

### Sistem Gereksinimleri
- **Node.js**: v16.0.0 veya üzeri
- **npm**: v8.0.0 veya üzeri
- **PostgreSQL**: v12.0 veya üzeri
- **Git**: v2.0.0 veya üzeri

### Geliştirme Araçları
- **Expo CLI**: Mobil uygulama geliştirme için
- **React Native**: Mobil uygulama framework'ü
- **TypeScript**: Tip güvenliği için

## Kurulum Adımları

### 1. Projeyi Klonlama

```bash
git clone <repository-url>
cd event-week-app
```

### 2. Bağımlılıkları Yükleme

```bash
# Tüm projeler için bağımlılıkları yükle
npm run install:all

# Veya her proje için ayrı ayrı
npm run install:mobile
npm run install:backend
npm run install:admin
```

### 3. Veritabanı Kurulumu

#### PostgreSQL Kurulumu

**Windows:**
1. [PostgreSQL resmi sitesinden](https://www.postgresql.org/download/windows/) indirin
2. Kurulum sırasında şifre belirleyin
3. pgAdmin ile veritabanı oluşturun

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Veritabanı Oluşturma

```sql
-- PostgreSQL'e bağlanın
psql -U postgres

-- Veritabanı oluşturun
CREATE DATABASE event_week;

-- Kullanıcı oluşturun (opsiyonel)
CREATE USER eventweek_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE event_week TO eventweek_user;
```

### 4. Backend Konfigürasyonu

```bash
cd backend
cp env.example .env
```

`.env` dosyasını düzenleyin:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=event_week
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Diğer konfigürasyonlar...
```

### 5. Veritabanı Şemasını Oluşturma

```bash
cd backend
npm run migrate
npm run seed
```

### 6. Backend'i Başlatma

```bash
cd backend
npm run dev
```

Backend http://localhost:3000 adresinde çalışacak.

### 7. Mobil Uygulama Kurulumu

```bash
cd mobile-app

# Expo CLI'yi global olarak yükleyin (eğer yüklü değilse)
npm install -g @expo/cli

# Uygulamayı başlatın
npm start
```

### 8. Admin Panel Kurulumu

```bash
cd admin-panel
npm start
```

Admin panel http://localhost:3001 adresinde çalışacak.

## Geliştirme Ortamı

### Tüm Servisleri Başlatma

```bash
# Ana dizinde
npm run dev:all  # Backend ve admin paneli birlikte
```

### Test Hesapları

Kurulum tamamlandıktan sonra aşağıdaki test hesaplarını kullanabilirsiniz:

**Admin Panel:**
- Email: `admin@eventweek.com`
- Şifre: `admin123`

**Mobil Uygulama:**
- Email: `participant1@eventweek.com`
- Şifre: `participant123`

## Sorun Giderme

### Yaygın Sorunlar

1. **Port Çakışması**
   - Backend: 3000 portu kullanılıyorsa `.env` dosyasında `PORT` değişkenini değiştirin
   - Admin Panel: 3001 portu kullanılıyorsa `package.json`'da `start` scriptini değiştirin

2. **Veritabanı Bağlantı Hatası**
   - PostgreSQL servisinin çalıştığından emin olun
   - `.env` dosyasındaki veritabanı bilgilerini kontrol edin
   - Firewall ayarlarını kontrol edin

3. **Expo Bağlantı Sorunları**
   - Aynı ağda olduğunuzdan emin olun
   - QR kodu tarayarak Expo Go uygulamasında test edin

### Log Dosyaları

- **Backend**: `backend/logs/` klasöründe
- **Admin Panel**: Browser console'da
- **Mobil**: Expo developer tools'da

## Üretim Ortamı

### Backend Deployment

1. **Environment Variables**
   ```env
   NODE_ENV=production
   DB_HOST=your_production_db_host
   DB_PASSWORD=your_secure_password
   JWT_SECRET=your_very_secure_jwt_secret
   ```

2. **Build**
   ```bash
   cd backend
   npm run build
   npm start
   ```

### Admin Panel Deployment

```bash
cd admin-panel
npm run build
# build/ klasörünü web sunucunuza yükleyin
```

### Mobil Uygulama Build

```bash
cd mobile-app
expo build:android  # Android için
expo build:ios      # iOS için
```

## Güvenlik

- Üretim ortamında güçlü şifreler kullanın
- JWT secret'ını güvenli tutun
- HTTPS kullanın
- Veritabanı erişimini kısıtlayın
- Düzenli güvenlik güncellemeleri yapın

## Destek

Sorunlarınız için:
1. GitHub Issues'da sorun bildirin
2. Dokümantasyonu kontrol edin
3. Log dosyalarını inceleyin
4. Geliştirici ekibiyle iletişime geçin
