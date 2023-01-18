const logger = require('../utils/logger');
const { auth, config } = require('../utils/boot.js');
const dash = require('../dashboard/server');
module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    await client.db.syncAll();
    logger.debug("Checking guild data in database for music.");
    await client.guilds.cache.each(async (guild) => {
      let music = await client.db.music.findOne({ where: { guildId: guild.id }, queue: [] });
      if (!music) music = await client.db.music.create({ guildId: guild.id });
      logger.debug(JSON.stringify(music, null, 2));
    });
    logger.debug("Checking user data in database for economy.");
    await client.users.cache.each(async (user) => {
      if (user.bot) return;
      let econ = await client.db.economy.findOne({ where: { userId: user.id } });
      if (!econ) econ = await client.db.economy.create({
        userId: user.id, inventory: []
      });
      logger.debug(JSON.stringify(econ, null, 2));
    });
    logger.info(`Connected as bot user '${client.user.tag}'`);
    try {
      client.dash.run(client, {
        clientID: client.user.id ?? process.env.CLIENT_ID,
        oauthSecret: auth.oauthSecret ?? process.env.OAUTH_SECRET,
        callbackURL: config.general.callbackUrl ?? process.env.CALLBACK_URL,
        sessionSecret: auth.sessionSecret ?? process.env.SESSION_SECRET
      });
    } catch (error) {
      logger.fatal("Dashboard failed to start!");
      logger.fatal(error); logger.debug(error.stack);
    };
  }
};