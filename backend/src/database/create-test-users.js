const { sequelize } = require('./connection');
const User = require('../models/User');
const Event = require('../models/Event');
const Program = require('../models/Program');
const Speaker = require('../models/Speaker');
const Appointment = require('../models/Appointment');
const Transfer = require('../models/Transfer');
const Activity = require('../models/Activity');
const bcrypt = require('bcryptjs');

const createTestUsers = async () => {
  try {
    // Set environment to use SQLite
    process.env.USE_SQLITE = 'true';
    process.env.NODE_ENV = 'development';
    
    console.log('Environment variables:');
    console.log('USE_SQLITE:', process.env.USE_SQLITE);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync database models first
    await sequelize.sync({ force: true });
    console.log('✅ Database models synchronized.');

    // Create admin user first
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

    // Create test events
    const testEvents = [
      {
        id: '1',
        name: 'Event Week 2024',
        description: 'Yıllık teknoloji konferansı',
        startDate: '2024-01-15',
        endDate: '2024-01-17',
        location: 'İstanbul Kongre Merkezi',
        status: 'active',
        organizerId: 'admin-user-id',
        isRegistrationOpen: true
      },
      {
        id: '2',
        name: 'React Native Workshop',
        description: 'Mobil uygulama geliştirme workshopu',
        startDate: '2024-01-20',
        endDate: '2024-01-20',
        location: 'Online',
        status: 'active',
        organizerId: 'admin-user-id',
        isRegistrationOpen: true
      },
      {
        id: '3',
        name: 'Product Management Summit',
        description: 'Ürün yönetimi zirvesi',
        startDate: '2024-01-25',
        endDate: '2024-01-26',
        location: 'Ankara Otel',
        status: 'active',
        organizerId: 'admin-user-id',
        isRegistrationOpen: true
      }
    ];

    for (const eventData of testEvents) {
      await Event.create(eventData);
    }
    console.log('✅ Test events created.');

    // Create test users
    const testUsers = [
      {
        email: 'organizer@eventweek.com',
        password: 'organizer123',
        firstName: 'Organizer',
        lastName: 'User',
        role: 'organizer',
        company: 'Event Week',
        department: 'Events',
        title: 'Event Organizer',
        phoneNumber: '5550000002',
        eventId: '1',
        isActive: true
      },
      {
        email: 'participant@eventweek.com',
        password: 'participant123',
        firstName: 'Participant',
        lastName: 'User',
        role: 'participant',
        company: 'Test Company',
        department: 'Marketing',
        title: 'Marketing Manager',
        phoneNumber: '5550000003',
        eventId: '1',
        isActive: true
      },
      // Mobile app test users
      {
        phoneNumber: '5551234567',
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        email: 'ahmet@email.com',
        role: 'participant',
        eventId: '1',
        isActive: true
      },
      {
        phoneNumber: '5559876543',
        firstName: 'Dr. Jane',
        lastName: 'Smith',
        email: 'jane@email.com',
        role: 'speaker',
        eventId: '1',
        isActive: true
      },
      {
        phoneNumber: '5554567890',
        firstName: 'Mehmet',
        lastName: 'Demir',
        email: 'mehmet@email.com',
        role: 'participant',
        eventId: '2',
        isActive: true
      },
      {
        phoneNumber: '5551111111',
        firstName: 'Ayşe',
        lastName: 'Demir',
        email: 'ayse@email.com',
        role: 'speaker',
        eventId: '2',
        isActive: true
      },
      {
        phoneNumber: '5552222222',
        firstName: 'Elif',
        lastName: 'Özkan',
        email: 'elif@email.com',
        role: 'speaker',
        eventId: '3',
        isActive: true
      }
    ];

    for (const userData of testUsers) {
      let existingUser;
      
      // Check by email if email exists, otherwise check by phone
      if (userData.email) {
        existingUser = await User.findOne({ where: { email: userData.email } });
      } else {
        existingUser = await User.findOne({ 
          where: { 
            phoneNumber: userData.phoneNumber,
            eventId: userData.eventId 
          } 
        });
      }
      
      if (!existingUser) {
        const user = await User.create(userData);
        const qrCode = `EW-${user.id.substring(0, 8).toUpperCase()}`;
        await user.update({ qrCode });
        console.log(`✅ Created user: ${userData.email || userData.phoneNumber}`);
      } else {
        console.log(`⚠️  User already exists: ${userData.email || userData.phoneNumber}`);
      }
    }

    console.log('✅ Test users created successfully!');

    // Create test programs
    const testPrograms = [
      {
        id: '1',
        eventId: '1',
        title: 'Açılış Konuşması',
        description: 'Event Week 2024 açılış konuşması',
        startTime: '2024-01-15T09:00:00Z',
        endTime: '2024-01-15T09:30:00Z',
        location: 'Ana Salon',
        speakerId: '1', // Speaker ID
        isActive: true
      },
      {
        id: '2',
        eventId: '1',
        title: 'React Native Workshop',
        description: 'Mobil uygulama geliştirme workshopu',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T12:00:00Z',
        location: 'Workshop Salonu',
        speakerId: '1', // Speaker ID
        isActive: true
      },
      {
        id: '3',
        eventId: '2',
        title: 'Product Management Summit',
        description: 'Ürün yönetimi zirvesi',
        startTime: '2024-01-20T09:00:00Z',
        endTime: '2024-01-20T17:00:00Z',
        location: 'Online',
        speakerId: '2', // Speaker ID
        isActive: true
      }
    ];

    for (const programData of testPrograms) {
      await Program.create(programData);
    }
    console.log('✅ Test programs created.');

    // Create test speakers
    const testSpeakers = [
      {
        id: '1',
        eventId: '1',
        userId: null, // No user association for now
        firstName: 'Dr. Jane',
        lastName: 'Smith',
        title: 'Senior Developer',
        company: 'Innovation Labs',
        bio: '10+ yıllık deneyime sahip senior developer.',
        expertise: 'React, Node.js, Cloud Computing',
        isKeynote: true
      },
      {
        id: '2',
        eventId: '2',
        userId: null, // No user association for now
        firstName: 'Mehmet',
        lastName: 'Kaya',
        title: 'React Native Expert',
        company: 'Mobile Solutions',
        bio: 'React Native ile 5+ yıllık deneyime sahip mobil geliştirici.',
        expertise: 'React Native, JavaScript, Mobile Development',
        isKeynote: true
      }
    ];

    for (const speakerData of testSpeakers) {
      await Speaker.create(speakerData);
    }
    console.log('✅ Test speakers created.');

    // Create test appointments
    const testAppointments = [
      {
        id: '1',
        eventId: '1',
        requesterId: '3', // participant@eventweek.com
        requestedUserId: '2', // organizer@eventweek.com
        title: 'Teknik Görüşme',
        description: 'React Native projesi hakkında görüşme',
        appointmentDate: '2024-01-15T14:00:00Z',
        duration: 60,
        status: 'pending',
        type: 'meeting',
        maxParticipants: 2,
        currentParticipants: 0,
        isRecurring: false,
        reminderSent: false
      }
    ];

    // Skip appointments for now due to foreign key issues
    // for (const appointmentData of testAppointments) {
    //   await Appointment.create(appointmentData);
    // }
    console.log('⚠️  Test appointments skipped (foreign key issues).');

    // Create test transfers
    const testTransfers = [
      {
        id: '1',
        eventId: '1',
        name: 'Havaalanı Transferi',
        description: 'İstanbul Havaalanı\'ndan otel transferi',
        departureLocation: 'İstanbul Havaalanı',
        arrivalLocation: 'İstanbul Kongre Merkezi',
        departureTime: '2024-01-15T08:00:00Z',
        arrivalTime: '2024-01-15T09:00:00Z',
        capacity: 50,
        price: 25.00,
        isActive: true
      }
    ];

    for (const transferData of testTransfers) {
      await Transfer.create(transferData);
    }
    console.log('✅ Test transfers created.');

    // Create test activities
    const testActivities = [
      {
        id: '1',
        eventId: '1',
        name: 'Networking Etkinliği',
        description: 'Katılımcılar arası networking etkinliği',
        startDate: '2024-01-15T18:00:00Z',
        endDate: '2024-01-15T20:00:00Z',
        location: 'Lobi',
        capacity: 100,
        type: 'networking',
        status: 'active',
        isActive: true
      }
    ];

    for (const activityData of testActivities) {
      await Activity.create(activityData);
    }
    console.log('✅ Test activities created.');

    console.log('✅ All test data created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test users:', error);
    process.exit(1);
  }
};

createTestUsers();
