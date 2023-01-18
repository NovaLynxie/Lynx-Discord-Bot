const fs = require('fs'), toml = require('toml'); require('dotenv').config(); let config;
const logger = require('./logger');
try {
  config = toml.parse(fs.readFileSync('./config.toml', 'utf-8'));
} catch (error) {
  logger.fatal(error.message); logger.debug(error.stack);
};
if (!process.env.DISCORD_TOKEN || process.env.DISCORD_TOKEN === '') {
  throw new Error('INVALID DISCORD TOKEN!');
};
config.general.ownerIDs = config.general.ownerIDs.filter(item => item === '');
if (config.general.ownerIDs.length < 1) {
  logger.warn('No Owners set! Operator commands will be disabled.');
};
if (!config.general.callbackUrl) config.general.callbackUrl = process.env.CALLBACK_URL;
module.exports = {
  auth: { token: process.env.DISCORD_TOKEN, oauthSecret: process.env.OAUTH_SECRET, sessionSecret: process.env.SESSION_SECRET },
  config
};