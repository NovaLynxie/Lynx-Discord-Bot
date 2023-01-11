const { EmbedBuilder, time, SlashCommandBuilder } = require('discord.js');
const locales = require('../assets/resources/locales.json');
const levels = require('../assets/resources/guildLevels.json');
const { stripIndents } = require('common-tags');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Gets info about a user or the server.')
    .setDMPermission(false)
    .addSubcommand(subcommand =>
      subcommand
        .setName('user')
        .setDescription('Get info about a specific user.')
        .addUserOption(option =>
          option.setName('target').setDescription('User?')
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('server')
        .setDescription('Get info about this server.')
    ),
  async execute(interaction) {
    const { client, guild, options } = interaction;
    const subcmd = options.getSubcommand();
    const target = options.getMember('target');
    const embed = new EmbedBuilder().setColor(0x0099ff);
    switch (subcmd) {
      case 'user':
        embed
          .setTitle('User Information')
          .setThumbnail(target.user.avatarURL())
          .setFields(
            {
              name: '> Member Information',
              value: stripIndents`
              Username: ${user.username}#${user.discriminator}
              Nickname: ${member.nickname ? member.nickname : "Not set"}
              Joined: ${time(member.joinedTimestamp)}
              Acc. Age: ${client.utils.accAge(user.createdAt)}
              Roles: ${mRoles.length}
              (${mRoles.length ? mRoles.join(', ') : "None"})
            `
            },
            {
              name: '> User Information',
              value: stripIndents`
              Bot Acc: ${user.bot}              
              Created: ${time(user.createdAt)}
              Status: ${(member.presence) ? member.presence.status : 'unknown'}
              Activity: ${(member.presence) ? member.presence.activities.join('\n') : 'no data'}
            `
            }
          )
        break;
      case 'server':
        embed
          .setTitle('Server Information')
          .setThumbnail(guild.iconURL())
          .setImage(guild.bannerURL())
          .setFields(
            {
              name: '> General Info',
              value: stripIndents`
              Name: ${guild.name} (ID: ${guild.id})
              Created: ${time(guild.createdAt)}
              Locale: ${locales[guild.preferredLocale]}           
            `
            },
            {
              name: '> Description (About Us)',
              value: stripIndents`
              ${(guild.description) ? guild.description : 'No description'}
            `
            },
            {
              name: '> Boost Details',
              value: stripIndents`
              Tier: ${levels.premiumTier[guild.premiumTier]}
              Subs: ${guild.premiumSubscriptionCount || '0'}
            `
            },
            {
              name: "> Statistics",
              value: stripIndents`          
              Roles: ${gRoles.length - 1}
              Emojis: ${emojis.size} (${(emojis.filter(emoji => emoji.animated === true).size)} animated, ${(emojis.filter(emoji => emoji.animated === false).size)} normal)
              Channels: ${channels.size} (${channels.filter(channel => channel.type === 'text').size} text, ${channels.filter(channel => channel.type === 'voice').size} voice)
              Members: ${guild.memberCount} (${members.filter(member => !member.user.bot).size} users, ${members.filter(member => member.user.bot).size} bots)
              MFA Level: ${(guild.mfaLevel === 'ELEVATED') ? 'Elevated' : 'None'}
              Verify Level: ${levels.verificationLevel[guild.verificationLevel]}
              Explicit Filter: ${levels.explicitFilterLevel[guild.explicitContentFilter]}
              NSFW Level: ${levels.nsfwLevel[guild.nsfwLevel]}
            `
            },
            {
              name: "> Presences",
              value: stripIndents`
              Online: ${presences.filter(presence => presence.status === 'online').size || members.filter(member => member.user.presence === 'online')} 
              Idle: ${presences.filter(presence => presence.status === 'idle').size || members.filter(member => member.user.presence === 'idle')} 
              Do Not Disturb: ${presences.filter(presence => presence.status === 'dnd').size || members.filter(member => member.user.presence === 'dnd')} 
              Offline: ${presences.filter(presence => presence.status === 'offline').size || members.filter(member => member.user.presence === 'offline').size}
            `
            },
            {
              name: `> Roles (${gRoles.length - 1} roles)`,
              value: gRoles.join(', ')
            }
          )
        break;
    }
  }
}