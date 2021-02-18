import express from 'express';
import { body, validationResult } from 'express-validator';

import { insert, select } from './db.js';

export const router = express.Router();

const nationalIdPattern = '^[0-9]{6}-?[0-9]{4}$';

/**
 * Higher-order function sem umlykur async middleware function með villumeðhöndlun.
 *
 * @param {function} fn - Middleware function sem grípa á villur fyrir
 * @returns {function} Middleware function með meðhöndlun
 */
function catchErrors(fn) {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

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

// Fylki af öllum hreinsunum fyrir undirskrift
const sanitazions = [
  body('name').trim().escape(),
  body('nationalId').blacklist('-').escape(),
  body('anonymous').trim().escape(),
  body('comment').trim().escape(),
];

/**
 * Route handler fyrir form undirskriftar.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {string} Form fyrir undirskrift
 */
async function form(req, res) {
  const list = await select();
  const data = {
    title: 'Undirskriftarlisti',
    name: '',
    nationalId: '',
    anonymous: '',
    comment: '',
    errors: [],
    listTitle: 'Undirskriftir',
    list,
  };

  res.render('form', data);
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

  const list = await select();

  const data = {
    title: 'Undirskriftarlisti',
    name,
    nationalId,
    anonymous,
    comment,
    listTitle: 'Undirskriftir',
    list,
  };

  const validation = validationResult(req);

  if (!validation.isEmpty()) {
    const errors = validation.array();
    data.errors = errors;

    return res.render('form', data);
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

  await insert(data);

  return res.redirect('/');
}

router.get('/', form);

router.post(
  '/',
  validations,
  showErrors,
  sanitazions,
  catchErrors(formPost),
);
