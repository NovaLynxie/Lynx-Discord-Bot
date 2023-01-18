const { Router } = require('express'), url = require('url');
const { checkAuth, isManaged } = require('../utils');
const passport = require('passport');
const router = Router();

// dashboard routes
router.get('/', (req, res) => {
  const client = res.locals.app.client;
  res.render('dashboard.ejs');
});

module.exports = router;