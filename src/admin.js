import express from 'express';

import passport from './login.js';
import { select } from './db.js';
import { catchErrors, ensureLoggedIn } from './utils.js';

export const router = express.Router();

async function index(req, res) {
  const list = await select();
  return res.render('admin', list);
}

router.get('/', ensureLoggedIn, catchErrors(index));
