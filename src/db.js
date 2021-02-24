import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const {
  DATABASE_URL: connectionString,
  NODE_ENV: nodeEnv = 'development',
} = process.env;

if (!connectionString) {
  console.error('Vantar DATABASE_URL');
  process.exit(1);
}

// Notum SSL tengingu við gagnagrunn ef við erum *ekki* í development mode, þ.e.a.s. á local vél
const ssl = nodeEnv !== 'development' ? { rejectUnauthorized: false } : false;

const pool = new pg.Pool({ connectionString, ssl });

pool.on('error', (err) => {
  console.error('Villa í tengingu við gagnagrunn, forrit hættir', err);
  process.exit(-1);
});

/**
 * Framkvæmir SQL fyrirspurn á gagnagrunn sem keyrir á `DATABASE_URL`,
 * skilgreint í `.env`
 *
 * @param {string} q Query til að keyra
 * @param {array} values Fylki af gildum fyrir query
 * @returns {object} Hlut með niðurstöðu af því að keyra fyrirspurn
 */
export async function query(q, values = []) { /* eslint-disable-line */
  const client = await pool.connect();

  try {
    const result = await client.query(q, values);
    return result;
  } finally {
    client.release();
  }
}

/**
 * Bætir við undirskrift.
 *
 * @param {array} data Fylki af gögnum fyrir undirskrift
 * @returns {object} Hlut með niðurstöðu af því að keyra fyrirspurn
 */
export async function insert(data) {
  let success = true;
  const q = `INSERT INTO signatures
              (name, nationalId, comment, anonymous)
            VALUES
              ($1, $2, $3, $4)`;
  const values = [data.name, data.nationalId, data.comment, data.anon];

  try {
    await query(q, values);
  } catch (e) {
    console.error('Villa við innsetningu gagna.', e);
    success = false;
  }
  return success;
}

/**
 * Sækir allar undirskriftir úr gagnagrunn.
 *
 * @returns {Promise<Array<list>>} Promise, sem er leyst sem fylki af öllum undirskriftum.
 */
export async function select() {
  let result = [];
  const q = 'SELECT name, nationalId, comment, anonymous, signed FROM signatures ORDER BY signed DESC';
  try {
    const queryResult = await query(q);
    if (queryResult && queryResult.rows) {
      result = queryResult.rows;
    }
  } catch (e) {
    console.error('Villa að ná í undirskriftir', e);
  }
  return result;
}

// Hjálparfall til að fjarlægja pg úr event loop-unni.
export async function end() {
  await pool.end();
}
