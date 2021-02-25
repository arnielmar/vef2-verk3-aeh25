import passport from 'passport';
import { Strategy } from 'passport-local';

import { findByUsername, findById, comparePasswords } from './users.js';

/**
 * Athugar hvort username og password sé til í notendakerfi.
 * Callback tekur við villu sem fyrsta argument, annað argument er
 * - `false` ef notandi ekki til eða lykilorð vitlaust
 * - Notandahlutur ef rétt
 *
 * @param {string} username Notandanafn til að athuga
 * @param {string} password Lykilorð til að athuga
 * @param {function} done Fall sem kallað er í með niðurstöðu
 */
async function strat(username, password, done) {
  try {
    const user = await findByUsername(username);

    if (!user) {
      return done(null, false);
    }

    const result = await comparePasswords(password, user);
    return done(null, result);
  } catch (e) {
    console.error(e);
    return done(e);
  }
}

/**
 * Geymir id á notanda í session.
 *
 * @param {object} user Notandi sem skráður er inn
 * @param {function} done Fall sem kallað er í með niðurstöðu
 */
function serializeUser(user, done) {
  done(null, user.id);
}

/**
 * Sækir notanda út frá id.
 *
 * @param {number} id id á notanda sem á að sækja
 * @param {function} done Fall sem kallað er í með niðurstöðu
 */
async function deserializeUser(id, done) {
  try {
    const user = await findById(id);
    done(null, user);
  } catch (e) {
    done(e);
  }
}

passport.use(new Strategy(strat));
passport.serializeUser(serializeUser);
passport.deserializeUser(deserializeUser);

export default passport;
