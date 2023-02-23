const logger = require('../../utils/logger');
const { Router } = require('express'), url = require('url');
const { checkAuth, generateView } = require('../utils'); const router = Router(); 

// main routes
router.get('/', function(req, res) {
  generateView(req, res, 'index.ejs');
});
router.get('/about', function(req, res) {
  generateView(req, res, 'about.ejs');
});
router.get('/profile', checkAuth, (req, res) => {
  generateView(req, res, 'profile.ejs');
});
router.get('/error', (req, res) => {
  logger.debug("Application error or invalid API response!");
  const messages = req.session.messages ?? "Unknown application error!";
  generateView(req, res, 'error.ejs', {message: messages});
});

module.exports = router;