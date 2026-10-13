# Event Week API Dokümantasyonu

## Genel Bilgiler

Event Week API, RESTful prensiplerine uygun olarak tasarlanmıştır. Tüm API istekleri JSON formatında yapılır ve yanıtlar da JSON formatında döner.

### Base URL
```
http://localhost:3000/api
```

### Kimlik Doğrulama
API'ye erişim için JWT token kullanılır. Token'ı header'da şu şekilde gönderin:
```
Authorization: Bearer <your-jwt-token>
```

## Hata Kodları

| Kod | Açıklama |
|-----|----------|
| 200 | Başarılı |
| 201 | Oluşturuldu |
| 400 | Hatalı İstek |
| 401 | Yetkisiz Erişim |
| 403 | Yasak |
| 404 | Bulunamadı |
| 500 | Sunucu Hatası |

## Kimlik Doğrulama (Authentication)

### POST /auth/register
Yeni kullanıcı kaydı.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "Ahmet",
  "lastName": "Yılmaz",
  "company": "TechCorp",
  "department": "IT",
  "title": "Developer",
  "phone": "+90 555 123 45 67"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Ahmet",
    "lastName": "Yılmaz",
    "role": "participant",
    "qrCode": "PART-001"
  }
}
```

### POST /auth/login
Kullanıcı girişi.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Ahmet",
    "lastName": "Yılmaz",
    "role": "participant"
  }
}
```

### GET /auth/me
Mevcut kullanıcı bilgilerini getir.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Ahmet",
    "lastName": "Yılmaz",
    "role": "participant"
  }
}
```

## Kullanıcılar (Users)

### GET /users
Tüm kullanıcıları listele (Admin/Organizer).

**Query Parameters:**
- `page`: Sayfa numarası (default: 1)
- `limit`: Sayfa başına kayıt (default: 10)
- `role`: Rol filtresi
- `search`: Arama terimi

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "Ahmet",
      "lastName": "Yılmaz",
      "role": "participant",
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### GET /users/:id
Belirli kullanıcı bilgilerini getir.

### PUT /users/:id
Kullanıcı bilgilerini güncelle.

### DELETE /users/:id
Kullanıcıyı sil (Admin).

## Etkinlikler (Events)

### GET /events
Tüm etkinlikleri listele.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Tech Summit 2024",
      "description": "Technology innovation summit",
      "startDate": "2024-03-15T09:00:00Z",
      "endDate": "2024-03-17T18:00:00Z",
      "location": "Istanbul Convention Center",
      "status": "published"
    }
  ]
}
```

### POST /events
Yeni etkinlik oluştur (Admin/Organizer).

**Request Body:**
```json
{
  "name": "Tech Summit 2024",
  "description": "Technology innovation summit",
  "startDate": "2024-03-15T09:00:00Z",
  "endDate": "2024-03-17T18:00:00Z",
  "location": "Istanbul Convention Center",
  "address": "Harbiye Mahallesi, Darülbedai Caddesi No:3",
  "city": "Istanbul",
  "country": "Turkey"
}
```

## Program (Programs)

### GET /programs
Etkinlik programını getir.

**Query Parameters:**
- `eventId`: Etkinlik ID'si
- `date`: Tarih filtresi (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Açılış Konuşması",
      "description": "Event opening keynote",
      "startTime": "2024-03-15T09:00:00Z",
      "endTime": "2024-03-15T10:00:00Z",
      "location": "Ana Salon",
      "type": "keynote"
    }
  ]
}
```

### POST /programs
Yeni program öğesi oluştur (Admin/Organizer).

## Konuşmacılar (Speakers)

### GET /speakers
Konuşmacıları listele.

**Query Parameters:**
- `eventId`: Etkinlik ID'si
- `featured`: Öne çıkan konuşmacılar (true/false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "bio": "Senior developer with 10+ years experience",
      "expertise": "React, Node.js, Cloud Computing",
      "isFeatured": true,
      "user": {
        "id": "uuid",
        "firstName": "Dr. Jane",
        "lastName": "Smith",
        "title": "Senior Developer",
        "company": "Innovation Labs"
      }
    }
  ]
}
```

## Oylama (Voting)

### GET /voting/sessions
Aktif oylama oturumlarını getir.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "En İyi Sunum",
      "question": "Hangi sunumu en beğendiniz?",
      "options": ["Sunum A", "Sunum B", "Sunum C"],
      "isActive": true,
      "endTime": "2024-03-15T12:00:00Z"
    }
  ]
}
```

### POST /voting/vote
Oy ver.

**Request Body:**
```json
{
  "votingSessionId": "uuid",
  "selectedOption": "Sunum A"
}
```

### GET /voting/results/:sessionId
Oylama sonuçlarını getir.

## Randevular (Appointments)

### GET /appointments
Randevuları listele.

**Query Parameters:**
- `eventId`: Etkinlik ID'si
- `status`: Durum filtresi (pending, accepted, declined)

### POST /appointments
Yeni randevu talebi oluştur.

**Request Body:**
```json
{
  "eventId": "uuid",
  "requestedUserId": "uuid",
  "title": "Teknik Görüşme",
  "description": "React Native hakkında konuşmak istiyorum",
  "startTime": "2024-03-15T14:00:00Z",
  "endTime": "2024-03-15T15:00:00Z",
  "location": "Lobby"
}
```

### PUT /appointments/:id/status
Randevu durumunu güncelle.

**Request Body:**
```json
{
  "status": "accepted"
}
```

## Transferler (Transfers)

### GET /transfers
Transferleri listele.

### POST /transfers
Yeni transfer talebi oluştur.

**Request Body:**
```json
{
  "eventId": "uuid",
  "transferType": "airport",
  "pickupLocation": "Istanbul Airport",
  "dropoffLocation": "Istanbul Convention Center",
  "scheduledTime": "2024-03-15T08:00:00Z"
}
```

## Aktiviteler (Activities)

### GET /activities
Aktiviteleri listele.

### POST /activities/:id/register
Aktiviteye kayıt ol.

## Uçuşlar (Flights)

### GET /flights
Uçuş bilgilerini getir.

### POST /flights
Uçuş bilgisi ekle (Admin/Organizer).

## Konaklama (Accommodations)

### GET /accommodations
Konaklama bilgilerini getir.

## Galeri (Gallery)

### GET /gallery
Galeri öğelerini listele.

### POST /gallery
Yeni galeri öğesi ekle.

**Request Body (Form Data):**
```
file: [image/video file]
title: "Event Photo"
description: "Opening ceremony"
```

## Dokümanlar (Documents)

### GET /documents
Dokümanları listele.

### POST /documents
Yeni doküman yükle.

### GET /documents/:id/download
Dokümanı indir.

## Notlar (Notes)

### GET /notes
Notları listele.

### POST /notes
Yeni not oluştur.

## Anketler (Surveys)

### GET /surveys
Anketleri listele.

### POST /surveys/:id/respond
Ankete yanıt ver.

## Duyurular (Announcements)

### GET /announcements
Duyuruları listele.

### POST /announcements
Yeni duyuru oluştur (Admin/Organizer).

## QR Kod (QR Code)

### POST /qr/scan
QR kod tarama.

**Request Body:**
```json
{
  "qrCode": "PART-001",
  "action": "entry",
  "location": "Main Hall"
}
```

### GET /qr/logs
QR kod loglarını getir.

## Admin İşlemleri

### POST /admin/upload-excel
Excel dosyası yükle (katılımcı, uçuş, transfer bilgileri).

### GET /admin/reports
Raporları getir.

### GET /admin/stats
İstatistikleri getir.

## Rate Limiting

API, rate limiting ile korunmaktadır:
- **Limit**: 100 istek / 15 dakika
- **Header**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## WebSocket Events

Gerçek zamanlı güncellemeler için WebSocket bağlantısı:

```javascript
const socket = io('http://localhost:3000');

// Oylama güncellemeleri
socket.on('voting-update', (data) => {
  console.log('Voting updated:', data);
});

// Randevu güncellemeleri
socket.on('appointment-update', (data) => {
  console.log('Appointment updated:', data);
});

// Duyuru güncellemeleri
socket.on('announcement', (data) => {
  console.log('New announcement:', data);
});
```

## Örnek Kullanım

### JavaScript/TypeScript

```javascript
const API_BASE = 'http://localhost:3000/api';

// Login
const login = async (email, password) => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
};

// Get events
const getEvents = async (token) => {
  const response = await fetch(`${API_BASE}/events`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
};
```

### cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get events
curl -X GET http://localhost:3000/api/events \
  -H "Authorization: Bearer <token>"
```
