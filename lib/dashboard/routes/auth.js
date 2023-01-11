const { Router } = require('express'), url = require('url');
const { checkAuth } = require('../utils');
const passport = require('passport');
const router = Router();

// authentication routes
router.get('/login', (req, res, next) => {
  if (req.session.backURL) {
    next();
  }	else 
  if (req.headers.referer) {
    const parsed = url.parse(req.headers.referer);
    logger.data(JSON.stringify(parsed));
    if (parsed.hostname === req.app.locals.domain) {
      req.session.backURL = parsed.path;
    }
  }	else {
    req.session.backURL = '/';
  }; next();
}, passport.authenticate('discord'));
router.get('/error', (req, res) => {
  res.render('autherr.ejs');
});
router.get('/profile', checkAuth, (req, res) => {
  renderView(res, req, 'profile.ejs');
});
router.get('/logout', function(req, res, next) {
  req.session.destroy(() => {
    req.logout((error) => {
      if (error) return next(error);
    });
    req.flash('info', 'You have now been logged out of the dashboard.');
    res.redirect('/');
  });
});

module.exports = router;