const logger = require('../../utils/logger');
const { Router } = require('express'), url = require('url');
const passport = require('passport');
const router = Router();

// api routes
router.get('/ping', (req, res) => {
  res.send("Discord Bot pinger endpoint!");
});

router.get('/discord/callback', passport.authenticate('discord', { failureRedirect: '/error', failureMessage: true }), (req, res) => {
  const { client } = res.locals.bot;
  logger.debug(`Checking req.user.id ${req.user.id} against owner IDs`);
  logger.data(`client.options.owners => ${client.options.owners}`);
  logger.data(`data type: ${typeof client.options.owners}`);
  (client.options.owners.includes(req.user.id)) ? req.session.isAdmin = true : req.session.isAdmin = false;
  if (req.session.isAdmin) {
    logger.debug(`User:${req.user.id} logged in as 'ADMIN'.`);
  }	else {
    logger.debug(`User:${req.user.id} logged in as 'USER'.`);
  };
  if (req.session.backURL) {
    logger.debug(`backURL: ${req.session.backURL}`);
    const url = req.session.backURL;
    req.session.backURL = null;
    res.redirect(url);
  }	else {
    res.redirect('/');
  };
});

module.exports = router;