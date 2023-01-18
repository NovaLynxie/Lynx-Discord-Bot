const logger = require('./utils/logger');
const { auth } = require('./utils/boot.js');
const { readdirSync } = require('fs'), path = require('path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { crashReporter } = require('./utils/report');
const { db, syncAll } = require('./utils/dbman');
const dash = require('./dashboard/server');
// configure client instance with required settings
const client = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildInvites,
    //GatewayIntentBits.GuildMembers,
    //GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    //GatewayIntentBits.MessageContent
  ]
});
// define or add additional client properties here
client.commands = { cache: new Collection() }; let success = 0;
client.db = { ...db, syncAll };
client.dash = dash;
client.music = { autoplayer: false, player: null, resource: null, state: 0, track: {}, volume: 0.5 };
// begin loading the command and event files
const cmdFiles = readdirSync('./lib/commands').filter(file => file.endsWith('.js'));
function reloadCommands(commandName) {
  if (commandName) {
    try {
      delete require.cache[require.resolve(`./commands/${commandName}.js`)];
      const command = require(`./commands/${commandName}.js`);
      if (!command.execute) {
        logger.error(`${file} -> Missing 'execute' function!`);
        logger.warn(`Command '${command.data.name}' has been disabled!`);
      } else {
        client.commands.cache.set(command.data.name, command);
        logger.debug(`Reloaded command.${command.data.name}`);
      };
    } catch (error) { logger.error(error); logger.debug(error.stack); };
  } else {
    for (const file of cmdFiles) {
      try {
        delete require.cache[require.resolve(`./commands/${file}`)];
        const command = require(`./commands/${file}`);
        if (!command.execute) {
          logger.error(`${file} -> Missing 'execute' function!`);
          logger.warn(`Command '${command.data.name}' has been disabled!`);
        } else {
          client.commands.cache.set(command.data.name, command); success++;
          logger.debug(`Reloaded command.${command.data.name}`);
        };
      } catch (error) { logger.error(error); logger.debug(error.stack); };
    };
  };
};
logger.debug(`Found ${cmdFiles.length} command files!`); success = 0;
for (const file of cmdFiles) {
  try {
    const command = require(`./commands/${file}`);
    logger.debug(`Loaded command.${command.data.name}`);
    if (!command.execute) {
      logger.error(`${file} -> Missing 'execute' function!`);
      logger.warn(`Command '${command.data.name}' has been disabled!`);
    } else {
      client.commands.cache.set(command.data.name, command); success++;  
    };
  } catch (error) { logger.error(error); logger.debug(error.stack); };
};
logger.init(`${success}/${cmdFiles.length} commands loaded!`);
const eventFiles = readdirSync('./lib/events').filter(file => file.endsWith('.js'));
logger.debug(`Found ${eventFiles.length} event files!`); success = 0;
for (const file of eventFiles) {
  const event = require(`./events/${file}`); success++;
  logger.debug(`Loaded event.${event.name}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  };
};
logger.init(`${success}/${eventFiles.length} events loaded!`);
process.on('unhandledRejection', (error, reason, promise) => {
  logger.fatal(error);
  logger.fatal(`Unhandled Rejection thrown by: ${promise}! Reason: ${reason}`);
  logger.debug(promise); logger.debug(reason);
});
// process events handled here
process.on('uncaughtException', (error, origin) => {
  logger.fatal("Bot has crashed unexpectedly!");
  logger.error(`Uncaught Exception thrown! Exception origin: ${origin}`);
  logger.error(error); logger.debug(error.stack);
  try {
    logger.warn('Generating crash report...'); crashReporter(error);
  } catch (error) {
    logger.warn('Failed to save crash to app logs! Check console for error.');
    logger.error(error); logger.debug(error.stack);
  };
  setTimeout(() => process.exit((error.code) ? error.code : -1), 5000);
});
client.login(auth.token ?? process.env.DISCORD_TOKEN).then(
  logger.init('Connecting to Discord...')
).catch((error) => {
  logger.error(error); logger.debug(error.stack);
});