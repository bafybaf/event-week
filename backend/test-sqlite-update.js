const { sequelize } = require('./src/database/connection');

const testSQLiteUpdate = async () => {
  try {
    console.log('🔍 SQLite güncelleme testi başlatılıyor...');
    
    // Önce bir kullanıcıyı bulalım
    const [users] = await sequelize.query('SELECT * FROM users LIMIT 1');
    
    if (users.length === 0) {
      console.log('❌ Hiç kullanıcı bulunamadı');
      return;
    }
    
    const user = users[0];
    console.log('👤 Test kullanıcısı:', user.first_name, user.last_name);
    
    // Basit bir güncelleme yapalım
    const newName = `Test_${Date.now()}`;
    const sql = 'UPDATE users SET first_name = ?, updated_at = ? WHERE id = ?';
    
    console.log('🚀 SQL sorgusu çalıştırılıyor:', sql);
    console.log('📊 Değerler:', [newName, new Date().toISOString(), user.id]);
    
    const [results] = await sequelize.query(sql, {
      replacements: [newName, new Date().toISOString(), user.id],
      type: sequelize.QueryTypes.UPDATE
    });
    
    console.log('✅ SQL güncelleme tamamlandı');
    console.log('📈 Etkilenen satır sayısı:', results);
    
    // Güncellenmiş veriyi kontrol edelim
    const [updatedUsers] = await sequelize.query('SELECT * FROM users WHERE id = ?', {
      replacements: [user.id],
      type: sequelize.QueryTypes.SELECT
    });
    
    if (updatedUsers.length > 0) {
      console.log('🔄 Güncellenmiş kullanıcı:', updatedUsers[0].first_name, updatedUsers[0].last_name);
      console.log('✅ Güncelleme başarılı!');
    } else {
      console.log('❌ Güncellenmiş kullanıcı bulunamadı');
    }
    
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await sequelize.close();
  }
};

testSQLiteUpdate();
