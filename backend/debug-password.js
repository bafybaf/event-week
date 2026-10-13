const { sequelize } = require('./src/database/connection');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

const debugPassword = async () => {
  try {
    // Set environment to use SQLite
    process.env.USE_SQLITE = 'true';
    
    console.log('🔍 Şifre debug işlemi başlatılıyor...');
    
    // Find admin user
    const adminUser = await User.findOne({ 
      where: { email: 'admin@eventweek.com' } 
    });
    
    if (!adminUser) {
      console.log('❌ Admin kullanıcısı bulunamadı!');
      process.exit(1);
    }
    
    console.log('✅ Admin kullanıcısı bulundu');
    console.log('📧 Email:', adminUser.email);
    console.log('🔑 Stored Password Hash:', adminUser.password);
    console.log('🔑 Password Length:', adminUser.password ? adminUser.password.length : 'null');
    
    // Test with different passwords
    const testPasswords = ['admin123', 'admin', 'password', '123456'];
    
    for (const testPassword of testPasswords) {
      console.log(`\n🧪 Testing password: "${testPassword}"`);
      
      if (adminUser.password) {
        const isValid = await bcrypt.compare(testPassword, adminUser.password);
        console.log(`   Result: ${isValid ? '✅ MATCH' : '❌ NO MATCH'}`);
      } else {
        console.log('   Result: ❌ NO PASSWORD STORED');
      }
    }
    
    // Create a new hash and test
    console.log('\n🔧 Creating new hash for "admin123"...');
    const newPassword = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    
    console.log('🔑 New Hash:', newHash);
    console.log('🔑 New Hash Length:', newHash.length);
    
    // Test new hash
    const newHashTest = await bcrypt.compare(newPassword, newHash);
    console.log('🧪 New Hash Test:', newHashTest ? '✅ SUCCESS' : '❌ FAILED');
    
    // Update password with new hash
    console.log('\n💾 Updating password in database...');
    await adminUser.update({ password: newHash });
    
    // Verify update
    const updatedUser = await User.findOne({ 
      where: { email: 'admin@eventweek.com' } 
    });
    
    console.log('✅ Password updated in database');
    console.log('🔑 Updated Hash:', updatedUser.password);
    
    // Final test
    const finalTest = await bcrypt.compare(newPassword, updatedUser.password);
    console.log('🧪 Final Test:', finalTest ? '✅ SUCCESS' : '❌ FAILED');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
};

debugPassword();

