const { Sequelize } = require('sequelize');

// Force SQLite for development
console.log('USE_SQLITE:', process.env.USE_SQLITE);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Always use SQLite for now
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
});

module.exports = { sequelize };
