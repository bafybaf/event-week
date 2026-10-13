const { sequelize } = require('./src/database/connection');
const bcrypt = require('bcryptjs');

const forceFixAdmin = async () => {
  try {
    // Set environment to use SQLite
    process.env.USE_SQLITE = 'true';
    
    console.log('🔥 Admin kullanıcısını zorla düzeltiyorum...');
    
    // Direct SQL query to update password
    const newPassword = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    console.log('🔑 Yeni hash:', hashedPassword);
    
    // Update directly with SQL
    const [results] = await sequelize.query(
      'UPDATE users SET password = ? WHERE email = ?',
      {
        replacements: [hashedPassword, 'admin@eventweek.com']
      }
    );
    
    console.log('✅ SQL güncelleme sonucu:', results);
    
    // Verify with direct SQL query
    const [userRows] = await sequelize.query(
      'SELECT email, password FROM users WHERE email = ?',
      {
        replacements: ['admin@eventweek.com']
      }
    );
    
    if (userRows.length > 0) {
      const user = userRows[0];
      console.log('✅ Kullanıcı bulundu:', user.email);
      console.log('🔑 Güncellenmiş şifre:', user.password);
      
      // Test password
      const isValid = await bcrypt.compare(newPassword, user.password);
      console.log('🧪 Şifre testi:', isValid ? '✅ BAŞARILI' : '❌ BAŞARISIZ');
      
      if (isValid) {
        console.log('\n🎉 BAŞARILI! Artık giriş yapabilirsiniz:');
        console.log('📧 Email: admin@eventweek.com');
        console.log('🔑 Şifre: admin123');
      }
    } else {
      console.log('❌ Kullanıcı bulunamadı!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
};

forceFixAdmin();

