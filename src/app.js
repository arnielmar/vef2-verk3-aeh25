import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';

import { router as registrationRouter } from './registration.js';
import { router as adminRouter } from './admin.js';
import passport from './login.js';
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

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  maxAge: 30 * 24 * 60 * 1000,  // 30 dagar
}));

app.use(passport.initialize());
app.use(passport.session());

app.set('views', 'views');
app.set('view engine', 'ejs');

app.use(express.static('public'));

app.locals.isInvalid = isInvalid;
app.locals.setDate = getDate;
//app.locals.countSignatures = countSignatures;

// Gera user hlut aðgengilegan fyrir view
app.use((req, res, next) => {
  if (req.isAuthenticated()) {
    // getum núna notað user í viewum
    res.locals.user = req.user;
  }

  next();
});

app.get('/admin/login', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/admin');
  }

  let message = '';

  if (req.session.messages && req.session.messages.length > 0) {
    message = req.session.messages.join(', ');
    req.session.messages = [];
  }

  return res.render('login', { message });
});

app.post(
  '/admin/login',

  passport.authenticate('local', {
    failureMessage: 'Notandi eða lykilorð vitlaust.',
    failureRedirect: '/admin/login',
  }),

  (req, res) => {
    res.redirect('/admin');
  },
);

app.get('/admin/logout', (req, res) => {
  req.logout();
  res.redirect('/admin');
});

app.use('/', registrationRouter);
app.use('/admin', adminRouter);

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
