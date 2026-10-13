const { sequelize } = require('./src/database/connection');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

const fixAdminPassword = async () => {
  try {
    // Set environment to use SQLite
    process.env.USE_SQLITE = 'true';
    
    console.log('🔧 Admin şifresi düzeltiliyor...');
    
    // Find admin user
    const adminUser = await User.findOne({ 
      where: { email: 'admin@eventweek.com' } 
    });
    
    if (!adminUser) {
      console.log('❌ Admin kullanıcısı bulunamadı!');
      process.exit(1);
    }
    
    console.log('✅ Admin kullanıcısı bulundu:', adminUser.email);
    
    // Hash new password
    const newPassword = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    await adminUser.update({ password: hashedPassword });
    
    console.log('✅ Admin şifresi güncellendi!');
    console.log('📧 Email:', adminUser.email);
    console.log('🔑 Şifre:', newPassword);
    
    // Test password
    const isValid = await bcrypt.compare(newPassword, hashedPassword);
    console.log('🧪 Şifre testi:', isValid ? '✅ Başarılı' : '❌ Başarısız');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
};

fixAdminPassword();

