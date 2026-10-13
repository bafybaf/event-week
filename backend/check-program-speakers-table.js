const { sequelize } = require('./src/database/connection');

async function checkTable() {
  try {
    await sequelize.authenticate();
    
    // Check table structure
    const [results] = await sequelize.query(`
      PRAGMA table_info(program_speakers);
    `);
    
    console.log('Table structure:');
    console.log(JSON.stringify(results, null, 2));
    
    // Check if any data exists
    const [data] = await sequelize.query(`
      SELECT * FROM program_speakers LIMIT 5;
    `);
    
    console.log('\nSample data:');
    console.log(JSON.stringify(data, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTable();

