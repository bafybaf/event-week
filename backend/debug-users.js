const { sequelize } = require('./src/database/connection');

const debugUsers = async () => {
  try {
    console.log('🔍 Kullanıcıları kontrol ediyoruz...');
    
    // Tüm kullanıcıları listele
    const [users] = await sequelize.query('SELECT id, first_name, last_name, email FROM users');
    
    console.log('👥 Toplam kullanıcı sayısı:', users.length);
    console.log('📋 Kullanıcı listesi:');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}, Ad: ${user.first_name} ${user.last_name}, Email: ${user.email}`);
    });
    
    if (users.length > 0) {
      const firstUser = users[0];
      console.log('\n🔧 İlk kullanıcıyı güncelleyelim...');
      console.log('👤 Güncellenecek kullanıcı ID:', firstUser.id);
      
      const newName = `Updated_${Date.now()}`;
      const sql = 'UPDATE users SET first_name = ? WHERE id = ?';
      
      console.log('🚀 SQL:', sql);
      console.log('📊 Değerler:', [newName, firstUser.id]);
      
      const result = await sequelize.query(sql, {
        replacements: [newName, firstUser.id],
        type: sequelize.QueryTypes.UPDATE
      });
      
      console.log('✅ Güncelleme sonucu:', result);
      
      // Güncellenmiş veriyi kontrol et
      const [updatedUsers] = await sequelize.query('SELECT * FROM users WHERE id = ?', {
        replacements: [firstUser.id],
        type: sequelize.QueryTypes.SELECT
      });
      
      console.log('🔄 Güncellenmiş kullanıcı sayısı:', updatedUsers.length);
      if (updatedUsers.length > 0) {
        console.log('✅ Güncellenmiş kullanıcı:', updatedUsers[0].first_name, updatedUsers[0].last_name);
      }
    }
    
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await sequelize.close();
  }
};

debugUsers();

