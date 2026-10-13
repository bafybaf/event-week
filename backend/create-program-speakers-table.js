const { sequelize } = require('./src/database/connection');

async function createProgramSpeakersTable() {
  try {
    console.log('🔧 Creating program_speakers table...');
    
    await sequelize.authenticate();
    console.log('✅ Database connection established.');
    
    // Check if table exists
    const [results] = await sequelize.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='program_speakers';
    `);
    
    if (results.length > 0) {
      console.log('✅ program_speakers table already exists.');
      process.exit(0);
    }
    
    // Create table manually with correct snake_case column names
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS program_speakers (
        id TEXT PRIMARY KEY,
        program_id TEXT NOT NULL,
        speaker_id TEXT NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        FOREIGN KEY (program_id) REFERENCES programs(id),
        FOREIGN KEY (speaker_id) REFERENCES speakers(id),
        UNIQUE(program_id, speaker_id)
      );
    `);
    
    // Create index
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS program_speakers_program_id_speaker_id 
      ON program_speakers (program_id, speaker_id);
    `);
    
    console.log('✅ program_speakers table created successfully.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating program_speakers table:', error);
    if (error.parent) {
      console.error('SQL Error:', error.parent.message);
      console.error('SQL:', error.parent.sql);
    }
    process.exit(1);
  }
}

createProgramSpeakersTable();
