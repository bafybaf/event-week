const { sequelize } = require('./src/database/connection');

async function checkNotesTable() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Check if notes table exists
    const [tableInfo] = await sequelize.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='notes';
    `);
    
    if (tableInfo.length === 0) {
      console.log('❌ Notes table does not exist!');
      return;
    }

    console.log('✅ Notes table exists.');

    // Get table structure
    console.log('\n📋 Table structure:');
    const [structure] = await sequelize.query('PRAGMA table_info(notes);');
    console.table(structure);

    // Get sample data
    console.log('\n📊 Sample data (first 5 rows):');
    const [sampleData] = await sequelize.query('SELECT * FROM notes LIMIT 5;');
    console.table(sampleData);

    // Count total notes
    const [countResult] = await sequelize.query('SELECT COUNT(*) as count FROM notes;');
    console.log(`\n📈 Total notes: ${countResult[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkNotesTable();


