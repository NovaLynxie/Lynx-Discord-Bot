const logger = require('../utils/logger');
module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    const { client } = interaction;
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.cache.get(interaction.commandName);
    if (!command) {
      logger.error(`No command matching ${interaction.commandName} was found.`);
      await interaction.reply({
        content: `Unknown command ${commandName}! Please try again or contact my administrator for assistance.`
      });
    };
    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error('Interaction error! Something went wrong while parsing interaction event!');
      logger.error(error); logger.debug(error.stack);
      await interaction.editReply({ content: 'There was an error while executing command!', ephemeral: true });
    }
  }
};