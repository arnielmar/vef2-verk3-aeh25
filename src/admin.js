import express from 'express';

import { query, select, deleteRow } from './db.js';
import { catchErrors, ensureLoggedIn } from './utils.js';

export const router = express.Router();

async function index(req, res) {
  let { offset = 0, limit = 50 } = req.query;
  offset = Number(offset);
  limit = Number(limit);
  const signaturesCount = await query('SELECT COUNT(*) AS count FROM signatures;');
  const list = await select(offset, limit);

  const result = {
    links: {
      self: {
        href: `/admin/?offset=${offset}&limit=${limit}`,
      },
    },
    items: list,
    offset,
    limit,
  };

  if (offset > 0) {
    result.links.prev = {
      href: `/admin/?offset=${offset - limit}&limit=${limit}`,
    };
  }

  if (list.length <= limit) {
    result.links.next = {
      href: `/admin/?offset=${Number(offset) + limit}&limit=${limit}`,
    };
  }

  return res.render('admin', {
    list,
    signaturesCount: signaturesCount.rows[0].count,
    result,
  });
}

async function deleteSignature(req, res) {
  const { id } = req.params;

  await deleteRow([id]);

  return res.redirect('/admin');
}

router.get('/', ensureLoggedIn, catchErrors(index));
router.post('/delete/:id', ensureLoggedIn, catchErrors(deleteSignature));
