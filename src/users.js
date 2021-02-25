import bcrypt from 'bcrypt';
import { query } from './db.js';

/**
 * Leitar að notanda í gagnagrunni með notandanafn username.
 *
 * @param {string} username Notendanafn
 */
export async function findByUsername(username) {
  const q = 'SELECT * FROM users WHERE username = $1';

  const result = await query(q, [username]);

  if (result.rowCount === 1) {
    return result.rows[0];
  }

  return null;
}

/**
 * Leitar að notanda í gagnagrunni með id id.
 *
 * @param {number} id id á notanda
 */
export async function findById(id) {
  const q = 'SELECT * FROM users WHERE id = $1';

  const result = await query(q, [id]);

  if (result.rowCount === 1) {
    return result.rows[0];
  }

  return null;
}

/**
 * Athugar hvort lykilorð sem slegið var inn sé það sama og lykilorð
 * þess notanda sem verið er að reyna að skrá inn.
 *
 * @param {string} password Lykilorð sem slegið var inn
 * @param {string} user Notandi sem verið er að reyna að skrá inn
 */
export async function comparePasswords(password, user) {
  const ok = await bcrypt.compare(password, user.password);

  if (ok) {
    return user;
  }

  return false;
}
