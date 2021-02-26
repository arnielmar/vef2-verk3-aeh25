import express from 'express';
import dotenv from 'dotenv';

import { query, select, deleteRow } from './db.js';
import { catchErrors, ensureLoggedIn } from './utils.js';

dotenv.config();

export const router = express.Router();

const {
  PORT: port = 3000,
} = process.env;

async function index(req, res) {
  let { offset = 0, limit = 50 } = req.query;
  offset = Number(offset);
  limit = Number(limit);
  const signaturesCount = await query('SELECT COUNT(*) AS count FROM signatures;');
  const list = await select(offset, limit);

  const result = {
    _links: {
      self: {
        href: `http://localhost:${port}/admin/?offset=${offset}&limit=${limit}`,
      },
    },
    items: list,
    offset,
    limit,
  };

  if (offset > 0) {
    result._links.prev = {
      href: `http://localhost:${port}/admin/?offset=${offset - limit}&limit=${limit}`,
    };
  }

  if (list.length <= limit) {
    result._links.next = {
      href: `http://localhost:${port}/admin/?offset=${Number(offset) + limit}&limit=${limit}`,
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
