const path = require('path');
const sqlite3 = require('sqlite3');
const { Client } = require('pg');

const sqlitePath = process.env.SQLITE_PATH || path.join(__dirname, '..', 'database.sqlite');

function sqliteAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

function coerce(value, pgType) {
  if (value === null || value === undefined) return null;
  if (pgType === 'boolean') {
    return value === true || value === 1 || value === '1' || value === 't' || value === 'true';
  }
  if (pgType === 'integer' || pgType === 'bigint' || pgType === 'smallint') {
    if (value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  }
  if (pgType === 'numeric' || pgType === 'double precision' || pgType === 'real') {
    if (value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  if (String(pgType).startsWith('timestamp')) {
    if (value === '') return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (pgType === 'time without time zone' || pgType === 'time with time zone') {
    if (value === '') return null;
    const match = String(value).match(/(\d{2}:\d{2}(?::\d{2})?)/);
    return match ? match[1] : String(value);
  }
  if (pgType === 'character varying' || pgType === 'text' || pgType === 'USER-DEFINED') {
    if (value === '') return null;
    return String(value);
  }
  return value;
}

async function main() {
  const sqlite = new sqlite3.Database(sqlitePath);
  const pg = new Client({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'eventweek',
    password: String(process.env.DB_PASSWORD || 'changeme'),
    database: process.env.DB_NAME || 'event_week'
  });
  await pg.connect();

  const sqliteTables = (
    await sqliteAll(
      sqlite,
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )
  ).map((row) => row.name);

  const pgTables = (
    await pg.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `)
  ).rows.map((row) => row.table_name);

  const tables = sqliteTables.filter((name) => pgTables.includes(name));
  console.log('Copying tables:', tables.join(', '));

  const enumRows = await pg.query(`
    SELECT t.typname, e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
  `);
  const enumValues = {};
  for (const row of enumRows.rows) {
    enumValues[row.typname] = enumValues[row.typname] || [];
    enumValues[row.typname].push(row.enumlabel);
  }
  const enumDefaults = {
    enum_documents_file_type: { spreadsheet: 'xlsx' },
    enum_flights_status: { active: 'scheduled' },
    enum_galleries_category: { ceremony: 'event' },
    enum_programs_type: { opening: 'session' }
  };

  await pg.query('SET session_replication_role = replica');
  await pg.query(`TRUNCATE TABLE ${tables.map((name) => `"${name}"`).join(', ')} RESTART IDENTITY CASCADE`);

  const summary = [];

  for (const table of tables) {
    const sqliteCols = (await sqliteAll(sqlite, `PRAGMA table_info("${table}")`)).map((col) => col.name);
    const pgCols = (
      await pg.query(
        `SELECT column_name, data_type, is_nullable
         FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1`,
        [table]
      )
    ).rows;
    const pgTypeByName = Object.fromEntries(pgCols.map((col) => [col.column_name, col]));
    const udtByName = Object.fromEntries(
      (
        await pg.query(
          `SELECT column_name, udt_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`,
          [table]
        )
      ).rows.map((col) => [col.column_name, col.udt_name])
    );
    const sharedCols = sqliteCols.filter((name) => pgTypeByName[name]);
    const rows = await sqliteAll(sqlite, `SELECT * FROM "${table}"`);

    let inserted = 0;
    let skipped = 0;
    for (const row of rows) {
      const values = sharedCols.map((name) => {
        let value = coerce(row[name], pgTypeByName[name].data_type);
        const udt = udtByName[name];
        if (udt && enumValues[udt] && value != null && !enumValues[udt].includes(String(value))) {
          const mapped = (enumDefaults[udt] || {})[String(value)];
          value = mapped || enumValues[udt][0];
        }
        return value;
      });
      const placeholders = sharedCols.map((_, index) => `$${index + 1}`).join(', ');
      const quotedCols = sharedCols.map((name) => `"${name}"`).join(', ');
      try {
        await pg.query(
          `INSERT INTO "${table}" (${quotedCols}) VALUES (${placeholders})`,
          values
        );
        inserted += 1;
      } catch (error) {
        skipped += 1;
        console.warn(`${table} row failed:`, error.message);
      }
    }

    const integerPk = pgCols.find((col) => col.column_name === 'id' && col.data_type === 'integer');
    if (integerPk) {
      await pg.query(
        `SELECT setval(pg_get_serial_sequence('"${table}"','id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1), true)`
      );
    }

    summary.push({ table, source: rows.length, inserted, skipped });
    console.log(`${table}: ${inserted}/${rows.length} copied` + (skipped ? ` (${skipped} skipped)` : ''));
  }

  await pg.query('SET session_replication_role = origin');
  await pg.end();
  sqlite.close();
  console.log('Done');
  console.table(summary);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
