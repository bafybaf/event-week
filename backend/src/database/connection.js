const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Sequelize } = require('sequelize');

const useSqlite = String(process.env.USE_SQLITE || '').toLowerCase() === 'true';

console.log('USE_SQLITE:', process.env.USE_SQLITE);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_HOST:', process.env.DB_HOST || 'localhost');
console.log('DB_NAME:', process.env.DB_NAME || 'event_week');

const define = {
  timestamps: true,
  underscored: true,
  freezeTableName: true
};

const sequelize = useSqlite
  ? new Sequelize({
      dialect: 'sqlite',
      storage: process.env.SQLITE_PATH || './database.sqlite',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      define
    })
  : new Sequelize({
      dialect: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME || 'event_week',
      username: process.env.DB_USER || 'eventweek',
      password: String(process.env.DB_PASSWORD ?? 'changeme'),
      logging: process.env.DB_LOGGING === 'true' ? console.log : false,
      define,
      dialectOptions: process.env.DB_SSL === 'true'
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {}
    });

module.exports = { sequelize };
