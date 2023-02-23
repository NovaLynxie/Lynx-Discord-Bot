const logger = require('../../utils/logger');
const { Router } = require('express'), url = require('url');
const { Permissions } = require('discord.js');
const { checkAuth, isManaged, generateView } = require('../utils');
const passport = require('passport');
const router = Router();

// dashboard routes
router.get('/', (req, res) => {
  generateView(req, res, 'dashboard.ejs', { Permissions });
});

module.exports = router;