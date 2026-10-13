const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const databaseDir = path.join(__dirname, '..', '..', '.pgdata');

async function main() {
  const { default: EmbeddedPostgres } = await import('embedded-postgres');
  const pg = new EmbeddedPostgres({
    databaseDir,
    user: process.env.DB_USER || 'eventweek',
    password: process.env.DB_PASSWORD || 'changeme',
    port: Number(process.env.DB_PORT || 5432),
    persistent: true,
    authMethod: 'scram-sha-256',
    initdbFlags: ['--encoding=UTF8', '--no-locale']
  });

  await pg.initialise();
  await pg.start();

  const dbName = process.env.DB_NAME || 'event_week';
  try {
    await pg.createDatabase(dbName);
    console.log(`Created database ${dbName}`);
  } catch (error) {
    const message = String(error && error.message ? error.message : error);
    if (!/already exists/i.test(message)) {
      throw error;
    }
  }

  console.log(`PostgreSQL listening on localhost:${process.env.DB_PORT || 5432}`);
  console.log(`Database: ${dbName} / user: ${process.env.DB_USER || 'eventweek'}`);
}

main().catch((error) => {
  console.error('Local PostgreSQL failed to start:', error);
  process.exit(1);
});
