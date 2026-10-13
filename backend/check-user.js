const { sequelize } = require('./src/database/connection');

const checkUser = async () => {
  try {
    const [results] = await sequelize.query('SELECT id, email, phone_number, event_id FROM users WHERE phone_number = "5550000001"');
    console.log('User data:', results);
    
    // Update the user's eventId
    await sequelize.query('UPDATE users SET event_id = "1" WHERE phone_number = "5550000001"');
    console.log('Updated user eventId to 1');
    
    // Check again
    const [updatedResults] = await sequelize.query('SELECT id, email, phone_number, event_id FROM users WHERE phone_number = "5550000001"');
    console.log('Updated user data:', updatedResults);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkUser();
