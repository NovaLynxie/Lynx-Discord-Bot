const { Router } = require('express'), url = require('url');
const { checkAuth, isManaged } = require('../utils');
const passport = require('passport');
const router = Router();

// dashboard routes
router.get('/', (req, res) => {
  res.render('')
});

module.exports = router;