const logger = require('../../utils/logger');
const { Router } = require('express'), url = require('url');
const router = Router();

// main routes
router.get('/', function(req, res) {
  res.render('index.ejs');
});
router.get('/about', function(req, res) {
  res.render('about.ejs');
});

module.exports = router;