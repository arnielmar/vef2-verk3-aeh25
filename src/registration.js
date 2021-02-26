import express from 'express';
import { body, validationResult } from 'express-validator';
import xss from 'xss';
import dotenv from 'dotenv';

import { query, insert, select } from './db.js';
import { catchErrors } from './utils.js';

dotenv.config();

export const router = express.Router();

const {
  PORT: port = 3000,
} = process.env;

const nationalIdPattern = '^[0-9]{6}-?[0-9]{4}$';

// Fylki af öllum validations fyrir undirskrift
const validations = [
  body('name')
    .isLength({ min: 1 })
    .withMessage('Nafn má ekki vera tómt'),
  body('name')
    .isLength({ max: 128 })
    .withMessage('Nafn má ekki vera meira en 128 stafir'),
  body('nationalId')
    .isLength({ min: 1 })
    .withMessage('Kennitala má ekki vera tóm'),
  body('nationalId')
    .matches(new RegExp(nationalIdPattern))
    .withMessage('Kennitala verður að vera á formi 000000-0000 eða 0000000000'),
  body('comment')
    .isLength({ max: 400 })
    .withMessage(('Athugasemd má ekki vera meira en 400 stafir')),
];

const xssSanitizations = [
  body('name').customSanitizer((v) => xss(v)),
  body('nationalId').customSanitizer((v) => xss(v)),
  body('comment').customSanitizer((v) => xss(v)),
  body('anonymous').customSanitizer((v) => xss(v)),
]

// Fylki af öllum hreinsunum fyrir undirskrift
const sanitizations = [
  body('name').trim().escape(),
  body('nationalId').blacklist('-'),
];

/**
 * Route handler fyrir form undirskriftar.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {string} Form fyrir undirskrift
 */
async function index(req, res) {
  const errors = [];
  const formData = {
    name: '',
    nationalId: '',
    anonymous: '',
    comment: '',
  };

  const signaturesCount = await query('SELECT COUNT(*) AS count FROM signatures;');

  let { offset = 0, limit = 50 } = req.query;
  offset = Number(offset);
  limit = Number(limit);
  const list = await select(offset, limit);

  const result = {
    _links: {
      self: {
        href: `http://localhost:${port}/?offset=${offset}&limit=${limit}`,
      },
    },
    items: list,
    offset,
    limit,
  };

  if (offset > 0) {
    result._links.prev = {
      href: `http://localhost:${port}/?offset=${offset - limit}&limit=${limit}`,
    };
  }

  if (list.length <= limit) {
    result._links.next = {
      href: `http://localhost:${port}/?offset=${Number(offset) + limit}&limit=${limit}`,
    };
  }

  res.render('index', {
    errors,
    formData,
    list,
    signaturesCount: signaturesCount.rows[0].count,
    result,
  });
}

/**
 * Route handler sem athugar stöðu á undirskrift og birtir villur ef einhverjar,
 * sendir annars áfram í næsta middleware.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {function} next Næsta middleware
 * @returns Næsta middleware ef í lagi, annars síðu með villum
 */
async function showErrors(req, res, next) {
  const {
    body: {
      name = '',
      nationalId = '',
      anonymous = '',
      comment = '',
    } = {},
  } = req;

  const formData = {
    name,
    nationalId,
    comment,
    anonymous,
  };

  const list = await select();

  const validation = validationResult(req);

  if (!validation.isEmpty()) {
    const errors = validation.errors;
    return res.render('index', { formData, errors, list});
  }

  return next();
}

/**
 * Ósamstilltur route handler sem vistar gögn í gagnagrunn og endurhleður síðu.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 */
async function formPost(req, res) {
  const {
    body: {
      name = '',
      nationalId = '',
      anonymous = '',
      comment = '',
    } = {},
  } = req;

  const anon = anonymous ? 'TRUE' : 'FALSE';

  const data = {
    name,
    nationalId,
    anon,
    comment,
  };

  let success = true;

  try {
    success = await insert(data);
  } catch (e) {
    console.error(e);
  }

  if (success) {
    return res.redirect('/');
  }

  return res.render('error', { title: 'Gat ekki skráð!', error: 'Hefur þú skrifað undir áður?' });
}

router.get('/', catchErrors(index));

router.post(
  '/',
  validations,
  xssSanitizations,
  catchErrors(showErrors),
  sanitizations,
  catchErrors(formPost),
);
