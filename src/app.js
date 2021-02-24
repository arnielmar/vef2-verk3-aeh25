import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';

import { router as registrationRouter } from './registration.js';
import { getDate, isInvalid } from './utils.js';

dotenv.config();

const {
  PORT: port = 3000,
  SESSION_SECRET: sessionSecret,
  DATABASE_URL: connectionString,
} = process.env;

if (!connectionString || !sessionSecret) {
  console.error('Vantar gögn í env');
  process.exit(1);
}

const app = express();

app.use(express.urlencoded({ extended: true }));

app.set('views', 'views');
app.set('view engine', 'ejs');

app.use(express.static('public'));

app.locals.isInvalid = isInvalid;
app.locals.setDate = getDate;

app.use('/', registrationRouter);

/**
 * Middleware sem sér um 404 villur.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 */
function notFoundHandler(req, res) {
  res.status(404).render('error', { title: '404 villa', error: 'Úps! Þessi síða fannst ekki' });
}

/**
 * Middleware sem sér um villumeðhöndlun.
 *
 * @param {object} error Error hlutur
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 */
function errorHandler(error, req, res) {
  console.error(error);
  res.status(500).render('error', { title: 'Villa kom upp' });
}

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`);
});
