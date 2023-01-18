const logger = require('../utils/logger');

function checkAuth(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    logger.debug(`req.originalUrl: '${req.originalUrl}'`);
    req.session.backURL = req.originalUrl; res.status(401);
    logger.debug(`req.session.backURL: '${req.session.backURL}'`);
    res.redirect('/login');
  };
};
function isManaged(guild, user) {
  const member = guild.members.cache.get(user.id);
  const res = member.permissions.has('MANAGE_GUILD');
  return res;
};

module.exports = { checkAuth, isManaged };