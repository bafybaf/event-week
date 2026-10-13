const { sequelize } = require('./src/database/connection');
const User = require('./src/models/User');
const Event = require('./src/models/Event');
const Program = require('./src/models/Program');
const Speaker = require('./src/models/Speaker');
const Appointment = require('./src/models/Appointment');
const Transfer = require('./src/models/Transfer');
const Activity = require('./src/models/Activity');
const Flight = require('./src/models/Flight');
const Accommodation = require('./src/models/Accommodation');
const Gallery = require('./src/models/Gallery');
const Document = require('./src/models/Document');
const Note = require('./src/models/Note');
const Survey = require('./src/models/Survey');
const Report = require('./src/models/Report');
const Setting = require('./src/models/Setting');
const Announcement = require('./src/models/Announcement');
const bcrypt = require('bcryptjs');

const createDemoData = async () => {
  try {
    console.log('🚀 Demo verileri oluşturuluyor...');
    console.log('USE_SQLITE:', process.env.USE_SQLITE);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync database models first
    await sequelize.sync({ force: true });
    console.log('✅ Database models synchronized.');

    // 1. Create admin user
    const adminUser = await User.create({
      id: 'admin-user-id',
      email: 'admin@eventweek.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      company: 'Event Week',
      department: 'IT',
      title: 'System Administrator',
      phoneNumber: '5550000001',
      isActive: true
    });
    console.log('✅ Admin user created.');

    // 2. Create test events
    const testEvents = [
      {
        id: '1',
        name: 'Event Week 2024',
        description: 'Yıllık teknoloji konferansı ve networking etkinliği',
        startDate: '2024-01-15',
        endDate: '2024-01-17',
        location: 'İstanbul Kongre Merkezi',
        address: 'Darülbedai Caddesi No:3, Şişli/İstanbul',
        city: 'İstanbul',
        country: 'Türkiye',
        status: 'active',
        maxParticipants: 500,
        currentParticipants: 0,
        registrationDeadline: '2024-01-10',
        isRegistrationOpen: true,
        organizerId: adminUser.id,
        coverImage: 'https://via.placeholder.com/800x400/2563eb/ffffff?text=Event+Week+2024',
        website: 'https://eventweek2024.com',
        contactEmail: 'info@eventweek2024.com',
        contactPhone: '+90 212 555 0123'
      },
      {
        id: '2',
        name: 'Tech Summit 2024',
        description: 'Yapay zeka ve makine öğrenmesi zirvesi',
        startDate: '2024-02-20',
        endDate: '2024-02-22',
        location: 'Ankara Bilim Merkezi',
        address: 'Bilkent Üniversitesi Kampüsü, Ankara',
        city: 'Ankara',
        country: 'Türkiye',
        status: 'active',
        maxParticipants: 300,
        currentParticipants: 0,
        registrationDeadline: '2024-02-15',
        isRegistrationOpen: true,
        organizerId: adminUser.id,
        coverImage: 'https://via.placeholder.com/800x400/059669/ffffff?text=Tech+Summit+2024',
        website: 'https://techsummit2024.com',
        contactEmail: 'info@techsummit2024.com',
        contactPhone: '+90 312 555 0456'
      },
      {
        id: '3',
        name: 'Startup Weekend',
        description: 'Girişimcilik ve inovasyon hafta sonu',
        startDate: '2024-03-10',
        endDate: '2024-03-12',
        location: 'İzmir Fuar Merkezi',
        address: 'Fuar Merkezi, Gaziemir/İzmir',
        city: 'İzmir',
        country: 'Türkiye',
        status: 'active',
        maxParticipants: 200,
        currentParticipants: 0,
        registrationDeadline: '2024-03-05',
        isRegistrationOpen: true,
        organizerId: adminUser.id,
        coverImage: 'https://via.placeholder.com/800x400/d97706/ffffff?text=Startup+Weekend',
        website: 'https://startupweekend2024.com',
        contactEmail: 'info@startupweekend2024.com',
        contactPhone: '+90 232 555 0789'
      }
    ];

    const events = await Event.bulkCreate(testEvents);
    console.log('✅ Test events created.');

    // 3. Create users for each event
    const testUsers = [
      // Event Week 2024 users
      {
        email: 'organizer@eventweek.com',
        password: 'organizer123',
        firstName: 'Mehmet',
        lastName: 'Yılmaz',
        role: 'organizer',
        company: 'Event Week',
        department: 'Organization',
        title: 'Event Organizer',
        phoneNumber: '5550000002',
        eventId: '1',
        isActive: true
      },
      {
        email: 'participant1@eventweek.com',
        password: 'participant123',
        firstName: 'Ahmet',
        lastName: 'Kaya',
        role: 'participant',
        company: 'TechCorp',
        department: 'Development',
        title: 'Senior Developer',
        phoneNumber: '5550000003',
        eventId: '1',
        isActive: true
      },
      {
        email: 'speaker1@eventweek.com',
        password: 'speaker123',
        firstName: 'Ayşe',
        lastName: 'Demir',
        role: 'speaker',
        company: 'AI Solutions',
        department: 'Research',
        title: 'AI Research Lead',
        phoneNumber: '5550000004',
        eventId: '1',
        isActive: true
      },
      // Tech Summit 2024 users
      {
        email: 'organizer2@techsummit.com',
        password: 'organizer123',
        firstName: 'Fatma',
        lastName: 'Özkan',
        role: 'organizer',
        company: 'Tech Summit',
        department: 'Organization',
        title: 'Event Manager',
        phoneNumber: '5550000005',
        eventId: '2',
        isActive: true
      },
      {
        email: 'participant2@techsummit.com',
        password: 'participant123',
        firstName: 'Ali',
        lastName: 'Çelik',
        role: 'participant',
        company: 'DataCorp',
        department: 'Analytics',
        title: 'Data Scientist',
        phoneNumber: '5550000006',
        eventId: '2',
        isActive: true
      },
      // Startup Weekend users
      {
        email: 'participant3@startupweekend.com',
        password: 'participant123',
        firstName: 'Zeynep',
        lastName: 'Arslan',
        role: 'participant',
        company: 'StartupHub',
        department: 'Business',
        title: 'Business Developer',
        phoneNumber: '5550000007',
        eventId: '3',
        isActive: true
      }
    ];

    const users = await User.bulkCreate(testUsers);
    console.log('✅ Test users created.');

    // 4. Create programs
    const testPrograms = [
      {
        eventId: '1',
        title: 'Açılış Konuşması',
        description: 'Event Week 2024 açılış konuşması ve genel bilgilendirme',
        startTime: '09:00',
        endTime: '10:00',
        date: '2024-01-15',
        location: 'Ana Salon',
        speakerId: null,
        type: 'opening',
        status: 'scheduled'
      },
      {
        eventId: '1',
        title: 'Yapay Zeka ve Gelecek',
        description: 'Yapay zeka teknolojilerinin gelecekteki etkileri',
        startTime: '10:30',
        endTime: '11:30',
        date: '2024-01-15',
        location: 'Konferans Salonu A',
        speakerId: null,
        type: 'presentation',
        status: 'scheduled'
      },
      {
        eventId: '1',
        title: 'Networking Öğle Yemeği',
        description: 'Katılımcılar arası networking ve öğle yemeği',
        startTime: '12:00',
        endTime: '13:30',
        date: '2024-01-15',
        location: 'Yemek Salonu',
        speakerId: null,
        type: 'networking',
        status: 'scheduled'
      },
      {
        eventId: '2',
        title: 'Machine Learning Workshop',
        description: 'Pratik makine öğrenmesi workshop\'u',
        startTime: '14:00',
        endTime: '17:00',
        date: '2024-02-20',
        location: 'Workshop Salonu',
        speakerId: null,
        type: 'workshop',
        status: 'scheduled'
      }
    ];

    const programs = await Program.bulkCreate(testPrograms);
    console.log('✅ Test programs created.');

    // 5. Create speakers
    const testSpeakers = [
      {
        eventId: '1',
        firstName: 'Dr. Ayşe',
        lastName: 'Demir',
        title: 'AI Research Lead',
        company: 'AI Solutions',
        bio: 'Yapay zeka alanında 15 yıllık deneyime sahip araştırmacı',
        email: 'ayse.demir@aisolutions.com',
        phone: '+90 532 111 2233',
        photo: 'https://via.placeholder.com/200x200/2563eb/ffffff?text=AD',
        socialMedia: {
          linkedin: 'https://linkedin.com/in/ayse-demir',
          twitter: '@ayse_demir_ai'
        },
        expertise: ['Artificial Intelligence', 'Machine Learning', 'Deep Learning'],
        isActive: true
      },
      {
        eventId: '1',
        firstName: 'Prof. Dr. Mehmet',
        lastName: 'Kaya',
        title: 'Computer Science Professor',
        company: 'İTÜ',
        bio: 'Bilgisayar bilimleri alanında önde gelen akademisyen',
        email: 'mehmet.kaya@itu.edu.tr',
        phone: '+90 532 222 3344',
        photo: 'https://via.placeholder.com/200x200/059669/ffffff?text=MK',
        socialMedia: {
          linkedin: 'https://linkedin.com/in/mehmet-kaya',
          twitter: '@prof_mehmet_kaya'
        },
        expertise: ['Computer Science', 'Algorithms', 'Data Structures'],
        isActive: true
      },
      {
        eventId: '2',
        firstName: 'Elif',
        lastName: 'Yılmaz',
        title: 'Data Science Manager',
        company: 'TechCorp',
        bio: 'Veri bilimi ve analitik alanında uzman',
        email: 'elif.yilmaz@techcorp.com',
        phone: '+90 532 333 4455',
        photo: 'https://via.placeholder.com/200x200/d97706/ffffff?text=EY',
        socialMedia: {
          linkedin: 'https://linkedin.com/in/elif-yilmaz',
          twitter: '@elif_yilmaz_ds'
        },
        expertise: ['Data Science', 'Statistics', 'Python'],
        isActive: true
      }
    ];

    const speakers = await Speaker.bulkCreate(testSpeakers);
    console.log('✅ Test speakers created.');

    // 6. Create activities
    const testActivities = [
      {
        eventId: '1',
        name: 'Kahve Molası',
        description: 'Katılımcılar için kahve ve atıştırmalık molası',
        type: 'social',
        startDate: '2024-01-15 15:30:00',
        endDate: '2024-01-15 16:00:00',
        location: 'Foyer',
        capacity: 500,
        price: 0,
        isActive: true
      },
      {
        eventId: '1',
        name: 'Hackathon',
        description: '24 saatlik kodlama yarışması',
        type: 'workshop',
        startDate: '2024-01-16 09:00:00',
        endDate: '2024-01-17 09:00:00',
        location: 'Hackathon Salonu',
        capacity: 100,
        price: 0,
        isActive: true
      },
      {
        eventId: '2',
        name: 'Panel: AI\'nin Geleceği',
        description: 'Yapay zeka uzmanları ile panel tartışması',
        type: 'seminar',
        startDate: '2024-02-21 16:00:00',
        endDate: '2024-02-21 17:30:00',
        location: 'Panel Salonu',
        capacity: 200,
        price: 0,
        isActive: true
      }
    ];

    const activities = await Activity.bulkCreate(testActivities);
    console.log('✅ Test activities created.');

    // 7. Create flights
    const testFlights = [
      {
        eventId: '1',
        flightNumber: 'TK001',
        airline: 'Turkish Airlines',
        departureAirport: 'İstanbul Airport (IST)',
        arrivalAirport: 'İstanbul Airport (IST)',
        departureDate: '2024-01-14',
        arrivalDate: '2024-01-14',
        departureTime: '20:00',
        arrivalTime: '22:00',
        price: 1500,
        status: 'active'
      },
      {
        eventId: '2',
        flightNumber: 'TK002',
        airline: 'Turkish Airlines',
        departureAirport: 'İstanbul Airport (IST)',
        arrivalAirport: 'Ankara Esenboğa Airport (ESB)',
        departureDate: '2024-02-19',
        arrivalDate: '2024-02-19',
        departureTime: '18:00',
        arrivalTime: '19:30',
        price: 800,
        status: 'active'
      }
    ];

    const flights = await Flight.bulkCreate(testFlights);
    console.log('✅ Test flights created.');

    // 8. Create accommodations
    const testAccommodations = [
      {
        eventId: '1',
        name: 'Grand Hotel İstanbul',
        type: 'hotel',
        address: 'Taksim Meydanı, İstanbul',
        city: 'İstanbul',
        country: 'Türkiye',
        checkInDate: '2024-01-14',
        checkOutDate: '2024-01-18',
        pricePerNight: 500,
        contactInfo: '+90 212 555 0100',
        imageUrl: 'https://via.placeholder.com/400x300/2563eb/ffffff?text=Grand+Hotel',
        status: 'active'
      },
      {
        eventId: '2',
        name: 'Ankara Business Hotel',
        type: 'hotel',
        address: 'Kızılay, Ankara',
        city: 'Ankara',
        country: 'Türkiye',
        checkInDate: '2024-02-19',
        checkOutDate: '2024-02-23',
        pricePerNight: 300,
        contactInfo: '+90 312 555 0200',
        imageUrl: 'https://via.placeholder.com/400x300/059669/ffffff?text=Business+Hotel',
        status: 'active'
      }
    ];

    const accommodations = await Accommodation.bulkCreate(testAccommodations);
    console.log('✅ Test accommodations created.');

    // 9. Create gallery items
    const testGallery = [
      {
        eventId: '1',
        title: 'Açılış Töreni',
        description: 'Event Week 2024 açılış töreni fotoğrafları',
        imageUrl: 'https://via.placeholder.com/800x600/2563eb/ffffff?text=Opening+Ceremony',
        category: 'ceremony',
        uploadDate: '2024-01-15'
      },
      {
        eventId: '1',
        title: 'Networking',
        description: 'Katılımcılar arası networking anları',
        imageUrl: 'https://via.placeholder.com/800x600/059669/ffffff?text=Networking',
        category: 'networking',
        uploadDate: '2024-01-15'
      },
      {
        eventId: '2',
        title: 'Workshop',
        description: 'Machine Learning workshop fotoğrafları',
        imageUrl: 'https://via.placeholder.com/800x600/d97706/ffffff?text=Workshop',
        category: 'workshop',
        uploadDate: '2024-02-20'
      }
    ];

    const gallery = await Gallery.bulkCreate(testGallery);
    console.log('✅ Test gallery created.');

    // 10. Create documents
    const testDocuments = [
      {
        eventId: '1',
        title: 'Etkinlik Programı',
        description: 'Event Week 2024 detaylı program listesi',
        fileName: 'event-week-2024-program.pdf',
        fileUrl: 'https://via.placeholder.com/400x600/2563eb/ffffff?text=Program.pdf',
        fileType: 'pdf',
        category: 'agenda'
      },
      {
        eventId: '1',
        title: 'Katılımcı Rehberi',
        description: 'Etkinlik katılımcıları için rehber',
        fileName: 'participant-guide.pdf',
        fileUrl: 'https://via.placeholder.com/400x600/059669/ffffff?text=Guide.pdf',
        fileType: 'pdf',
        category: 'guide'
      },
      {
        eventId: '2',
        title: 'Workshop Materyalleri',
        description: 'Machine Learning workshop materyalleri',
        fileName: 'ml-workshop-materials.zip',
        fileUrl: 'https://via.placeholder.com/400x600/d97706/ffffff?text=Materials.zip',
        fileType: 'other',
        category: 'handout'
      }
    ];

    const documents = await Document.bulkCreate(testDocuments);
    console.log('✅ Test documents created.');

    // 11. Create notes
    const testNotes = [
      {
        userId: users[0].id,
        eventId: '1',
        title: 'Önemli Notlar',
        content: 'Açılış konuşmasında dikkat edilecek noktalar',
        isPrivate: false
      },
      {
        userId: users[1].id,
        eventId: '1',
        title: 'Kişisel Notlarım',
        content: 'Yapay zeka sunumundan aldığım notlar',
        isPrivate: true
      },
      {
        userId: users[3].id,
        eventId: '2',
        title: 'Workshop Notları',
        content: 'Machine Learning workshop\'undan önemli noktalar',
        isPrivate: false
      }
    ];

    const notes = await Note.bulkCreate(testNotes);
    console.log('✅ Test notes created.');

    // 12. Create surveys
    const testSurveys = [
      {
        eventId: '1',
        title: 'Etkinlik Değerlendirme Anketi',
        description: 'Event Week 2024 etkinliği hakkında görüşleriniz',
        startDate: '2024-01-15',
        endDate: '2024-01-25',
        status: 'active',
        questions: JSON.stringify([
          {
            id: 1,
            type: 'rating',
            question: 'Etkinliği genel olarak nasıl değerlendiriyorsunuz?',
            required: true,
            options: ['1', '2', '3', '4', '5']
          },
          {
            id: 2,
            type: 'text',
            question: 'Etkinlik hakkında görüşlerinizi paylaşır mısınız?',
            required: false
          }
        ]),
        createdBy: adminUser.id
      },
      {
        eventId: '2',
        title: 'Workshop Memnuniyet Anketi',
        description: 'Machine Learning workshop değerlendirmesi',
        startDate: '2024-02-20',
        endDate: '2024-02-27',
        status: 'active',
        questions: JSON.stringify([
          {
            id: 1,
            type: 'rating',
            question: 'Workshop içeriğini nasıl buldunuz?',
            required: true,
            options: ['1', '2', '3', '4', '5']
          }
        ]),
        createdBy: adminUser.id
      }
    ];

    const surveys = await Survey.bulkCreate(testSurveys);
    console.log('✅ Test surveys created.');

    // 13. Create reports
    const testReports = [
      {
        eventId: '1',
        title: 'Katılımcı Raporu',
        description: 'Event Week 2024 katılımcı istatistikleri',
        type: 'summary',
        format: 'pdf',
        status: 'completed',
        parameters: '{"dateRange": {"start": "2024-01-15", "end": "2024-01-17"}}',
        fileUrl: 'https://via.placeholder.com/400x600/2563eb/ffffff?text=Report.pdf',
        createdBy: adminUser.id
      },
      {
        eventId: '2',
        title: 'Workshop Raporu',
        description: 'Machine Learning workshop katılım raporu',
        type: 'summary',
        format: 'pdf',
        status: 'completed',
        parameters: '{"workshopId": "ml-workshop-2024"}',
        fileUrl: 'https://via.placeholder.com/400x600/059669/ffffff?text=Workshop+Report.pdf',
        createdBy: adminUser.id
      }
    ];

    const reports = await Report.bulkCreate(testReports);
    console.log('✅ Test reports created.');

    // 14. Create settings
    const testSettings = [
      {
        key: 'app.name',
        value: 'Event Week App',
        description: 'Uygulama adı',
        type: 'string',
        category: 'general',
        isPublic: true,
        isEditable: true,
        isRequired: true,
        group: 'general',
        order: 1,
        isActive: true,
        eventId: null
      },
      {
        key: 'app.version',
        value: '1.0.0',
        description: 'Uygulama versiyonu',
        type: 'string',
        category: 'general',
        isPublic: true,
        isEditable: false,
        isRequired: true,
        group: 'general',
        order: 2,
        isActive: true,
        eventId: null
      },
      {
        key: 'notification.email.enabled',
        value: 'true',
        description: 'E-posta bildirimleri aktif mi?',
        type: 'boolean',
        category: 'notification',
        isPublic: false,
        isEditable: true,
        isRequired: false,
        group: 'notifications',
        order: 1,
        isActive: true,
        eventId: null
      },
      {
        key: 'event.max_participants',
        value: '500',
        description: 'Maksimum katılımcı sayısı',
        type: 'number',
        category: 'general',
        isPublic: true,
        isEditable: true,
        isRequired: true,
        group: 'events',
        order: 1,
        isActive: true,
        eventId: '1'
      }
    ];

    const settings = await Setting.bulkCreate(testSettings);
    console.log('✅ Test settings created.');

    // 15. Create transfers
    const testTransfers = [
      {
        eventId: '1',
        name: 'Havaalanı Transferi',
        type: 'airport',
        departureLocation: 'İstanbul Airport',
        arrivalLocation: 'İstanbul Kongre Merkezi',
        departureTime: '2024-01-14 22:30',
        arrivalTime: '2024-01-14 23:30',
        capacity: 50,
        price: 100,
        status: 'active'
      },
      {
        eventId: '2',
        name: 'Otel Transferi',
        type: 'hotel',
        departureLocation: 'Ankara Business Hotel',
        arrivalLocation: 'Ankara Bilim Merkezi',
        departureTime: '2024-02-20 08:00',
        arrivalTime: '2024-02-20 08:30',
        capacity: 30,
        price: 50,
        status: 'active'
      }
    ];

    const transfers = await Transfer.bulkCreate(testTransfers);
    console.log('✅ Test transfers created.');

    console.log('🎉 Tüm demo verileri başarıyla oluşturuldu!');
    console.log('\n📊 Oluşturulan Veriler:');
    console.log(`- ${events.length} Etkinlik`);
    console.log(`- ${users.length + 1} Kullanıcı (admin dahil)`);
    console.log(`- ${programs.length} Program`);
    console.log(`- ${speakers.length} Konuşmacı`);
    console.log(`- ${activities.length} Aktivite`);
    console.log(`- ${flights.length} Uçuş`);
    console.log(`- ${accommodations.length} Konaklama`);
    console.log(`- ${gallery.length} Galeri Öğesi`);
    console.log(`- ${documents.length} Doküman`);
    console.log(`- ${notes.length} Not`);
    console.log(`- ${surveys.length} Anket`);
    console.log(`- ${reports.length} Rapor`);
    console.log(`- ${settings.length} Ayar`);
    console.log(`- ${transfers.length} Transfer`);

    console.log('\n🔑 Giriş Bilgileri:');
    console.log('Admin: admin@eventweek.com / admin123');
    console.log('Organizer: organizer@eventweek.com / organizer123');
    console.log('Participant: participant1@eventweek.com / participant123');
    console.log('Speaker: speaker1@eventweek.com / speaker123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Demo veri oluşturma hatası:', error);
    process.exit(1);
  }
};

createDemoData();
