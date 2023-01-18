const logger = require('../../utils/logger');
const { Router } = require('express'), url = require('url');
const { checkAuth } = require('../utils');
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
router.get('/error', (req, res) => {
  logger.debug("Authentication error or invalid response!");
  res.render('error.ejs', {message: "Authentication error! Either Discord API sent back an invalid response or something has gone wrong."});
});
router.get('/profile', checkAuth, (req, res) => {
  renderView(res, req, 'profile.ejs');
});
router.get('/logout', function(req, res, next) {
  req.session.destroy(() => {
    req.logout((error) => {
      if (error) return next(error);
    });
    res.redirect('/');
  });
});

module.exports = router;