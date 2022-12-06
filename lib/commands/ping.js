const { EmbedBuilder, time, SlashCommandBuilder } = require('discord.js');
const locales = require('../assets/resources/locales.json');
const levels = require('../assets/resources/guildLevels.json');
const { stripIndents } = require('common-tags');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Bot Ping Test.'),
  async execute(interaction) {
    const { client } = interaction;
    const embed = new EmbedBuilder().setColor(0x0099ff);
    embed
      .setTitle('Ping Test')
      .setFields(
        { name: 'Message Response', value: `${Date.now() - interaction.createdTimestamp} ms` },
        { name: 'API Latency', value: `${Math.round(client.ws.ping)} ms` }
      )
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}