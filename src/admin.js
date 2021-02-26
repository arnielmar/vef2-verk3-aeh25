import express from 'express';

import { query, select, deleteRow } from './db.js';
import { catchErrors, ensureLoggedIn } from './utils.js';

export const router = express.Router();

async function index(req, res) {
  const list = await select();
  const signaturesCount = await query('SELECT COUNT(*) AS count FROM signatures;');
  return res.render('admin', {
    list,
    signaturesCount: signaturesCount.rows[0].count,
  });
}

async function deleteSignature(req, res) {
  const { id } = req.params;

  await deleteRow([id]);

  return res.redirect('/admin');
}

router.get('/', ensureLoggedIn, catchErrors(index));
router.post('/delete/:id', ensureLoggedIn, catchErrors(deleteSignature));
