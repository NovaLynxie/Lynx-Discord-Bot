const fs = require('fs'), path = require('path');
const logger = require('./logger');
const { REST, Routes } = require('discord.js');
const { CLIENT_ID, GUILD_ID, DISCORD_TOKEN } = process.env; const commands = [];
if (!DISCORD_TOKEN) return logger.fatal('DISCORD_TOKEN missing or undefined in environment variables or via command line!');
if (!CLIENT_ID) return logger.fatal('CLIENT_ID missing or undefined in environment variables or via command line!');
if (!GUILD_ID) return logger.fatal('GUILD_ID missing or undefined in environment variables or via command line!');
const cmdsPath = path.join(__dirname, '../commands');
logger.init(`Reading commands from commands directory...`);
const cmdFiles = fs.readdirSync(cmdsPath).filter(file => file.endsWith('.js'));
logger.init(`Found ${cmdFiles.length} command files!`);
for (const file of cmdFiles) {
    const filePath = path.join(cmdsPath, file);
    const command = require(filePath);
    logger.init(`Parsing command ${command.data.name} to JSON`);
    commands.push(command.data.toJSON());
};
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
logger.warn('Syncing application commands to your bot. Bot restart may be required to take effect!');
rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands })
  .then((data) => logger.info(`Successfully registered ${data.length} application commands.`))
  .catch(logger.error);
/*
rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands })
  .then((data) => logger.info(`Successfully registered ${data.length} application commands.`))
  .catch(logger.error);
*/
logger.warn('Check your Discord bot to see if the commands are synced. If nothing appears, check IDs and Token again and retry.');