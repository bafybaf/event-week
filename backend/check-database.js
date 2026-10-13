const { sequelize } = require('./src/database/connection');
const User = require('./src/models/User');
const Event = require('./src/models/Event');
const Program = require('./src/models/Program');
const Speaker = require('./src/models/Speaker');
const Transfer = require('./src/models/Transfer');
const Activity = require('./src/models/Activity');

const checkDatabase = async () => {
  try {
    console.log('🔍 Veritabanı içeriği kontrol ediliyor...\n');
    
    // Check users
    const userCount = await User.count();
    console.log(`👥 Kullanıcılar: ${userCount} adet`);
    
    // Check events
    const eventCount = await Event.count();
    console.log(`🎪 Etkinlikler: ${eventCount} adet`);
    
    // Check programs
    const programCount = await Program.count();
    console.log(`📅 Programlar: ${programCount} adet`);
    
    // Check speakers
    const speakerCount = await Speaker.count();
    console.log(`🎤 Konuşmacılar: ${speakerCount} adet`);
    
    // Check transfers
    const transferCount = await Transfer.count();
    console.log(`🚌 Transferler: ${transferCount} adet`);
    
    // Check activities
    const activityCount = await Activity.count();
    console.log(`🎯 Aktiviteler: ${activityCount} adet`);
    
    console.log('\n📊 Detaylı Bilgiler:');
    
    // Show events
    const events = await Event.findAll();
    console.log('\n🎪 Etkinlikler:');
    events.forEach(event => {
      console.log(`  - ${event.name} (${event.id})`);
    });
    
    // Show users by role
    const users = await User.findAll();
    console.log('\n👥 Kullanıcılar:');
    users.forEach(user => {
      console.log(`  - ${user.firstName} ${user.lastName} (${user.role}) - ${user.email || user.phoneNumber}`);
    });
    
    // Show programs
    const programs = await Program.findAll();
    console.log('\n📅 Programlar:');
    programs.forEach(program => {
      console.log(`  - ${program.title} (${program.location})`);
    });
    
    // Show speakers
    const speakers = await Speaker.findAll();
    console.log('\n🎤 Konuşmacılar:');
    speakers.forEach(speaker => {
      console.log(`  - ${speaker.firstName} ${speaker.lastName} (${speaker.company})`);
    });
    
    // Show transfers
    const transfers = await Transfer.findAll();
    console.log('\n🚌 Transferler:');
    transfers.forEach(transfer => {
      console.log(`  - ${transfer.name} (${transfer.departureLocation} → ${transfer.arrivalLocation})`);
    });
    
    // Show activities
    const activities = await Activity.findAll();
    console.log('\n🎯 Aktiviteler:');
    activities.forEach(activity => {
      console.log(`  - ${activity.name} (${activity.location})`);
    });
    
    console.log('\n✅ Veritabanı kontrolü tamamlandı!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
};

checkDatabase();

