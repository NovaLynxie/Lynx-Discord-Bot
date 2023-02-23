const logger = require('../utils/logger'); const path = require('path');
const viewsDir = path.resolve(`${process.cwd()}/lib/dashboard/views`);

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
function generateView(req, res, template, data = {}) {
  const { client, config } = res.locals.bot;
  const hideSecrets = (key, value) => {
    switch(key) {
      case 'bot': return '[REDACTED]';
      case 'config': return '[REDACTED]';
      default: return value;
    };
  };
  const payload = Object.assign(
    {
      bot: client, config: config, path: req.path,
      user: req.user ?? null,
      isAdmin: (req.session) ? req.session.isAdmin : null
    }, data
  );
  if (config.debug) {
    logger.debug('Dumping data from render parameters');
    logger.data(`baseData:${JSON.stringify(baseData, hideSecrets, 2)}`);
    logger.data(`data:${JSON.stringify(data, null, 2)}`);
  };
  res.render(path.resolve(`${viewsDir}${path.sep}${template}`), payload);
};

module.exports = { checkAuth, isManaged, generateView };