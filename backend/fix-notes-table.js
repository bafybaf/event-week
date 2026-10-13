const path = require('path');
const { Sequelize } = require('sequelize');

// Veritabanı dosyasının tam yolunu bul
const dbPath = path.resolve(__dirname, 'database.sqlite');
console.log('Database path:', dbPath);

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false,
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
});

async function fixNotesTable() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Önce tablonun varlığını kontrol et
    const [tableCheck] = await sequelize.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='notes';
    `);
    
    if (tableCheck.length === 0) {
      console.log('⚠️ Notes table does not exist. Creating it...');
      // Tablo yoksa oluştur
      await sequelize.query(`
        CREATE TABLE notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          category TEXT NOT NULL DEFAULT 'personal',
          priority TEXT NOT NULL DEFAULT 'medium',
          tags TEXT,
          is_public TINYINT(1) NOT NULL DEFAULT 0,
          is_pinned TINYINT(1) NOT NULL DEFAULT 0,
          is_archived TINYINT(1) NOT NULL DEFAULT 0,
          reminder_date DATETIME,
          reminder_sent TINYINT(1) NOT NULL DEFAULT 0,
          view_count INTEGER NOT NULL DEFAULT 0,
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          event_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          session_id TEXT,
          attachments TEXT,
          notes TEXT,
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL
        );
      `);
      console.log('✅ Notes table created.');
      return;
    }

    // SQLite'da event_id ve user_id'yi TEXT olarak değiştir
    console.log('🔧 Fixing notes table columns...');
    
    // SQLite'da ALTER COLUMN desteklenmediği için yeni tablo oluşturup verileri taşıyoruz
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS notes_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'personal',
        priority TEXT NOT NULL DEFAULT 'medium',
        tags TEXT,
        is_public TINYINT(1) NOT NULL DEFAULT 0,
        is_pinned TINYINT(1) NOT NULL DEFAULT 0,
        is_archived TINYINT(1) NOT NULL DEFAULT 0,
        reminder_date DATETIME,
        reminder_sent TINYINT(1) NOT NULL DEFAULT 0,
        view_count INTEGER NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        event_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        session_id TEXT,
        attachments TEXT,
        notes TEXT,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      );
    `);

    // Mevcut verileri yeni tabloya kopyala (event_id ve user_id'yi TEXT olarak cast et)
    await sequelize.query(`
      INSERT INTO notes_new (
        id, title, content, category, priority, tags,
        is_public, is_pinned, is_archived, reminder_date, reminder_sent,
        view_count, is_active, event_id, user_id, session_id,
        attachments, notes, created_at, updated_at
      )
      SELECT 
        id, title, content, category, priority, tags,
        is_public, is_pinned, is_archived, reminder_date, reminder_sent,
        view_count, is_active, 
        CAST(event_id AS TEXT) as event_id,
        CAST(user_id AS TEXT) as user_id,
        CAST(session_id AS TEXT) as session_id,
        attachments, notes, created_at, updated_at
      FROM notes;
    `);

    // Eski tabloyu sil
    await sequelize.query('DROP TABLE notes;');

    // Yeni tabloyu notes olarak yeniden adlandır
    await sequelize.query('ALTER TABLE notes_new RENAME TO notes;');

    console.log('✅ Notes table fixed successfully!');
    
    // Kontrol et
    const [structure] = await sequelize.query('PRAGMA table_info(notes);');
    console.log('\n📋 Updated table structure:');
    console.table(structure);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

fixNotesTable();

