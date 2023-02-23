const logger = require('../../utils/logger');
const { Router } = require('express'), url = require('url');
const { checkAuth, generateView } = require('../utils');
const passport = require('passport');
const router = Router();

// authentication routes
router.get('/login', (req, res, next) => {
  if (req.session.backURL) { next() };
  if (req.headers.referer) {
    const parsed = url.parse(req.headers.referer);
    logger.data(JSON.stringify(parsed));
    if (parsed.hostname === req.app.locals.domain) {
      req.session.backURL = parsed.path;
    }
  }	else { req.session.backURL = '/' }; next();
  logger.debug("Initiating authentication process.");
}, passport.authenticate('discord'));
router.get('/profile', checkAuth, (req, res) => {
  generateView(res, req, 'profile.ejs');
});
router.post('/logout', (req, res, next) => {
  req.logout((error) => {
    if (error) return next(error);
    res.redirect('/');
  });
});
// TODO: Replace with POST request!
router.get('/logout', function(req, res, next) {
  req.logout((error) => {
    if (error) return next(error);
  });
  res.redirect('/');
});
module.exports = router;