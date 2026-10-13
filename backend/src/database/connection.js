const { Sequelize } = require('sequelize');

const useSqlite = String(process.env.USE_SQLITE || '').toLowerCase() === 'true';

console.log('USE_SQLITE:', process.env.USE_SQLITE);
console.log('NODE_ENV:', process.env.NODE_ENV);

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
  : new Sequelize(
      process.env.DB_NAME || 'event_week',
      process.env.DB_USER || 'eventweek',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'postgres',
        port: Number(process.env.DB_PORT || 5432),
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        define,
        dialectOptions: process.env.DB_SSL === 'true'
          ? { ssl: { require: true, rejectUnauthorized: false } }
          : {}
      }
    );

module.exports = { sequelize };
