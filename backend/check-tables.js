const { sequelize } = require('./src/database/connection');

async function checkTables() {
  try {
    const [results] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Tables in database:');
    results.forEach(row => {
      console.log('-', row.name);
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTables();

