import express from 'express';
import dotenv from 'dotenv';

import { router as registrationRouter } from './registration.js';
import { getDate } from './formatDate.js';

dotenv.config();

const {
  PORT: port = 3000,
} = process.env;

const app = express();

app.use(express.urlencoded({ extended: true }));

app.set('views', 'views');
app.set('view engine', 'ejs');

app.use(express.static('public'));

/**
 * Hjálparfall til að athuga hvort reitur sé gildur eða ekki.
 *
 * @param {string} field - Middleware sem grípa á villur fyrir
 * @param {array} errors - Fylki af villum frá express-validator pakkanum
 * @returns {boolean} 'true' ef field er í 'errors', 'false' annars
 */
function isInvalid(field, errors) {
  return Boolean(errors.find((i) => i.param === field));
}

app.locals.isInvalid = isInvalid;
app.locals.setDate = getDate;

app.use('/', registrationRouter);

function notFoundHandler(req, res) {
  res.status(404).render('error', { title: '404 villa', error: 'Úps! Þessi síða fannst ekki' });
}

function errorHandler(error, req, res) {
  console.error(error);
  res.status(500).render('error', { title: 'Villa', error });
}

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`);
});
