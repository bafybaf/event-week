const { sequelize } = require('./connection');
const User = require('../models/User');
const Event = require('../models/Event');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Create admin user
    const adminUser = await User.create({
      email: 'admin@eventweek.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      title: 'System Administrator',
      company: 'Event Week',
      role: 'admin',
      qrCode: 'ADMIN-001'
    });

    console.log('✅ Admin user created:', adminUser.email);

    // Create organizer user
    const organizerUser = await User.create({
      email: 'organizer@eventweek.com',
      password: 'organizer123',
      firstName: 'John',
      lastName: 'Organizer',
      title: 'Event Organizer',
      company: 'TechCorp',
      role: 'organizer',
      qrCode: 'ORG-001'
    });

    console.log('✅ Organizer user created:', organizerUser.email);

    // Create sample speaker
    const speakerUser = await User.create({
      email: 'speaker@eventweek.com',
      password: 'speaker123',
      firstName: 'Dr. Jane',
      lastName: 'Smith',
      title: 'Senior Developer',
      company: 'Innovation Labs',
      department: 'Engineering',
      role: 'speaker',
      qrCode: 'SPK-001'
    });

    console.log('✅ Speaker user created:', speakerUser.email);

    // Create sample participants
    const participants = [
      {
        email: 'participant1@eventweek.com',
        password: 'participant123',
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        title: 'Software Developer',
        company: 'TechCorp',
        department: 'IT',
        qrCode: 'PART-001'
      },
      {
        email: 'participant2@eventweek.com',
        password: 'participant123',
        firstName: 'Ayşe',
        lastName: 'Demir',
        title: 'Product Manager',
        company: 'Innovation Labs',
        department: 'Product',
        qrCode: 'PART-002'
      },
      {
        email: 'participant3@eventweek.com',
        password: 'participant123',
        firstName: 'Mehmet',
        lastName: 'Kaya',
        title: 'UX Designer',
        company: 'Design Studio',
        department: 'Design',
        qrCode: 'PART-003'
      }
    ];

    for (const participant of participants) {
      const user = await User.create(participant);
      console.log('✅ Participant created:', user.email);
    }

    // Create sample event
    const sampleEvent = await Event.create({
      name: 'Tech Innovation Summit 2024',
      description: 'Annual technology innovation summit bringing together industry leaders, developers, and innovators.',
      startDate: new Date('2024-03-15T09:00:00Z'),
      endDate: new Date('2024-03-17T18:00:00Z'),
      location: 'Istanbul Convention Center',
      address: 'Harbiye Mahallesi, Darülbedai Caddesi No:3, Şişli/İstanbul',
      city: 'Istanbul',
      country: 'Turkey',
      status: 'published',
      organizerId: organizerUser.id,
      settings: {
        allowRegistration: true,
        allowVoting: true,
        allowAppointments: true,
        allowGallery: true,
        allowDocuments: true,
        allowSurveys: true
      }
    });

    console.log('✅ Sample event created:', sampleEvent.name);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Test Accounts:');
    console.log('Admin: admin@eventweek.com / admin123');
    console.log('Organizer: organizer@eventweek.com / organizer123');
    console.log('Speaker: speaker@eventweek.com / speaker123');
    console.log('Participants: participant1@eventweek.com / participant123');
    console.log('                participant2@eventweek.com / participant123');
    console.log('                participant3@eventweek.com / participant123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await sequelize.close();
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
