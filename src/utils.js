/**
 * Higher-order function sem umlykur async middleware function með villumeðhöndlun.
 *
 * @param {function} fn - Middleware function sem grípa á villur fyrir
 * @returns {function} Middleware function með meðhöndlun
 */
export function catchErrors(fn) {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

/**
 * Hjálparfall til að athuga hvort reitur sé gildur eða ekki.
 *
 * @param {string} field - Middleware sem grípa á villur fyrir
 * @param {array} errors - Fylki af villum frá express-validator pakkanum
 * @returns {boolean} 'true' ef field er í 'errors', 'false' annars
 */
export function isInvalid(field, errors) {
  return Boolean(errors.find((i) => i.param === field));
}

/**
 * Athugar hvort notandi sé innskráður og hleypir okkur þá áfram,
 * annars sendur áfram á '/admin'.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {function} next Næsta middleware
 */
export function ensureLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.redirect('/admin/login');
}

/**
 * Hjálparfall til að parse-a dagsetningu.
 *
 * @param {Object} date Dagsetning undirskriftar
 */
export function getDate(date) {
  let theDate = date.substring(0, 10);
  theDate = theDate.split('-');
  theDate = `${theDate[2]}.${theDate[1]}.${theDate[0]}`;
  return theDate;
}
