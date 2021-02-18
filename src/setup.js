import pg from 'pg';
import dotenv from 'dotenv';
import util from 'util';
import fs from 'fs';

dotenv.config();
const readFileAsync = util.promisify(fs.readFile);

const {
  DATABASE_URL: connectionString,
  NODE_ENV: nodeEnv = 'development',
} = process.env;

if (!connectionString) {
  console.error('Vantar DATABASE_URL');
  process.exit(1);
}

/**
 * Framkvæmir SQL fyrirspurn á gagnagrunn sem keyrir á `DATABASE_URL`,
 * skilgreint í `.env`
 *
 * @param {string} q Query til að keyra
 * @param {array} values Fylki af gildum fyrir query
 * @returns {object} Hlut með niðurstöðu af því að keyra fyrirspurn
 */
async function query(q, values = []) { /* eslint-disable-line */
  const ssl = nodeEnv !== 'development' ? { rejectUnauthorized: false } : false;
  const pool = new pg.Pool({ connectionString, ssl });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });

  const client = await pool.connect();

  try {
    const result = await client.query(q, values);
    return result;
  } catch (e) {
    console.error('Error in query', e);
  } finally {
    client.release();
  }

  await pool.end();
}

async function main() {
  console.info(`Set upp gagnagrunn á ${connectionString}`);
  // droppa töflu ef til
  await query('DROP TABLE IF EXISTS applications');
  console.info('Töflu eytt');

  // búa til töflu út frá skema
  try {
    const createTable = await readFileAsync('./sql/schema.sql');
    await query(createTable.toString('utf8'));
    console.info('Tafla búin til');
  } catch (e) {
    console.error('Villa við að búa til töflu:', e.message);
    return;
  }

  // bæta færslum við töflu
  try {
    const insert = await readFileAsync('./sql/fake.sql');
    await query(insert.toString('utf8'));
    console.info('Gögnum bætt við');
  } catch (e) {
    console.error('Villa við að bæta gögnum við:', e.message);
  }
}

main().catch((err) => {
  console.error(err);
});
