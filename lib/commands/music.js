const wait = require('util').promisify(setTimeout);
const logger = require('../utils/logger');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, time, SlashCommandBuilder } = require('discord.js');
const { AudioPlayerStatus: { Playing, Idle, Paused, AutoPaused }, createAudioPlayer, createAudioResource, getVoiceConnection, joinVoiceChannel, NoSubscriberBehavior: { Pause } } = require('@discordjs/voice');
const { stripIndents } = require('common-tags');
const playdl = require('play-dl');
playdl.getFreeClientID().then((clientID) => playdl.setToken({
  useragent: ['LynxBot/1.0 (https://github.com/NovaLynxie)'],
  soundcloud: { client_id: clientID }
}));
module.exports = {
  data: new SlashCommandBuilder()
    .setName('music')
    .setDescription('Music player! Play music from soundcloud or youtube.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a song to the queue.')
        .addStringOption(option =>
          option
            .setName('url')
            .setDescription('Enter a valid song url.')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('search')
        .setDescription('Search for a song using key words.')
        .addStringOption(option =>
          option
            .setName('youtube')
            .setDescription('Search through YouTube.')
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName('soundcloud')
            .setDescription('Search through Soundcloud.')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('player')
        .setDescription('Start up the player.')
    ),
  async execute(interaction) {
    const { client, channel, guild, member } = interaction;
    const music = client.db.music.findOne({ where: { guildId: guild.id } });
    const subcmd = interaction.options.getSubcommand();
    await interaction.deferReply(); await wait(1000);
    let { autoplay, player, track, resource, volume } = client.music;
    const newPlayer = () => createAudioPlayer({
      behaviours: { nosubscriber: Pause }
    });
    let collector, connection = getVoiceConnection(guild.id) ?? null;
    // music action buttons
    const playerCtrlBtns1 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('play').setEmoji('▶️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('pause').setEmoji('⏸️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('stop').setEmoji('⏹️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('vol-').setEmoji('🔉').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('vol+').setEmoji('🔊').setStyle(ButtonStyle.Secondary)
      )
    const playerCtrlBtns2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('vclink').setEmoji('🔘').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('restart').setEmoji('⏮').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('queue').setEmoji('📜').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('skip').setEmoji('⏭️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('closeplayer').setEmoji('🚪').setStyle(ButtonStyle.Secondary)
      );
    const musicQueueBtns = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('pageback').setEmoji('⬅️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('player').setEmoji('🔙').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('pagefwd').setEmoji('➡️').setStyle(ButtonStyle.Secondary)
      );
    async function parsePlaylist(url, type) {
      let playlist, queue = [];
      try {
        switch (type) {
          case 'yt':
            playlist = await playdl.playlist_info(url, { incomplete: true }); break;
          case 'so':
            playlist = await playdl.soundcloud(url); break;
          default:
            logger.debug(`Unknown playlist type '${type}'!`);
        };
      } catch (error) {
        logger.error('Failed to fetch playlist information!');
        logger.error(error.message); logger.debug(error.stack);
        throw error;
      };
      logger.verbose(`playlist:${JSON.stringify(playlist, null, 2)}`);
      if (playlist.tracks) {
        let tracks = await playlist.all_tracks(); let song;
        for (let item of tracks) {
          if (!item.fetched) {
            logger.debug(`Skipped track ${item.title} with reason 'SC_TRACK_INCOMPLETE'.`);
            continue;
          };
          logger.verbose(JSON.stringify(item, null, 2));
          queue.push({ title: item.name, duration: item.durationInSec, url: item.url, thumbnail: item.thumbnail, type: 'soundcloud', memberID: member.id });
        };
      };
      if (playlist.videos) {
        let videos = await playlist.all_videos();
        logger.verbose(`videos:${JSON.stringify(videos, null, 2)}`);
        for (let item of videos) {
          if (item.upcoming) {
            logger.debug('Unsupported type YOUTUBE_UPCOMING!');
            logger.debug(`Skipped video ${item.title} as  'YT_PREMIERE/UPCOMING'.`);
            continue;
          };
          if (item.live || item.durationInSec <= 0) {
            logger.debug('Unsupported type YOUTUBE_LIVESTREAM!');
            logger.debug(`Skipped video entry ${item.title} as 'YT_LIVESTREAM'.`);
          };
          logger.verbose(JSON.stringify(item, null, 2));
          queue.push({ title: item.title, duration: item.durationInSec, url: item.url, thumbnail: item.thumbnails[item.thumbnails.length - 1].url, type: 'youtube', memberID: member.id });
        };
        hidden = playlist.videoCount - queue.length;
      };
      logger.debug(`Parsed ${queue.length} songs! Adding them to music list.`);
      logger.verbose(`queue:${JSON.stringify(queue, null, 2)}`);
      return { queue, hidden };
    };
    async function resolveUrl(url) {
      let data, song, list, response = {
        content: 'sourceParser.placeholder.message',
        embeds: [], components: [],
        ephemeral: true
      };
      try {
        switch (await playdl.validate(url)) {
          case 'yt_playlist':
            data = await parsePlaylist(url, 'yt'); list = data.queue;
            response.content = `Queued ${list.length} songs from YouTube playlist! ${(data.hidden) ? `Skipped ${data.hidden} hidden songs.` : ''}`;
            break;
          case 'so_playlist':
            data = await parsePlaylist(url, 'so'); list = data.queue;
            response.content = `Queued ${list.length} songs from SoundCloud playlist!`;
            break;
          case 'yt_video':
            data = await playdl.video_info(url);
            let { video_details } = data;
            if (video_details.upcoming) {
              song = null;
              response.content = `Looks like you tried to add an upcoming YouTube premiere! You should be able to add this after ${time(video_details.upcoming)}.`
            } else if (video_details.durationInSec <= 0) {
              song = null;
              response.content = 'Sorry, I do not allow playback of YouTube livestreams in music player.';
            } else {
              song = { title: video_details.title, url: video_details.url, duration: video_details.durationRaw || video_details.durationInSec, thumbnail: video_details.thumbnails[0].url, type: 'youtube', memberID: member.id };
              response.content = `Added ${song.title} to the queue!`;
            };
            break;
          case 'so_track':
            data = await playdl.soundcloud(url);
            logger.data(JSON.stringify(data, null, 2));
            song = { title: data.name, duration: data.durationInSec, url: data.url, thumbnail: data.thumbnail, type: 'soundcloud', memberID: member.id };
            response.content = `Added ${song.title} to the queue!`;
            break;
          default:
            logger.debug('This song URL is not supported or recognised!');
            response.content = 'Unsupported or malformed song URL! Please check that the URL is valid and try again.';
            return;
        };
      } catch (error) {
        logger.error('Something went wrong while parsing the song request!');
        logger.error(error.message); logger.debug(error.stack);
      };
      if (song) music.queue.push(song);
      if (list) music.queue = music.queue.concat(list);
      client.db.music.update({ queue: music.queue }, { where: { guildId: guild.id } });
    };
    const queueSplit = (array, size) => {
      return Array.from({ length: Math.ceil(array.length / size) }, (v, i) => {
        array.slice(i * size, i * size + size);
      });
    };
    const baseColor = 0x0099ff;
    const errorEmbed = new EmbedBuilder()
      .setTitle('Player Error!')
      .setDescription('Music player has encountered an error!');
    function createPlayerEmbed() {
      const playerEmbed = new EmbedBuilder()
        .setColor(baseColor)
        .setTitle('Music Player')
        .setFields(
          { name: 'Track Info', value: `${(track) ? track.title : 'Nothing playing!'}`, inline: true }
        );
      return playerEmbed;
    };
    function createQueueEmbed() {
      let chunks;
      const formatChunks = (array, index = 1) => {
        return `${array[index].map(item => stripIndents`
      Title: ${item.title}
      Source: ${item.source}
      Duration: ${item.duration}
        `).join('\n')}`
      };
      const queueEmbed = new EmbedBuilder()
        .setColor(baseColor)
        .setTitle('Music Queue')
      if (music.queue) {
        chunks = queueSplit(music.queue, 5), index = 1;
        queueEmbed.setFields(
          { name: 'Upcoming', value: `${(queue.length) ? queue[0] : 'Queue Empty!'}`, inline: true },
          { name: 'Queued Songs', value: (chunks.length) ? formatChunks(chunks, index) : 'No songs queued!' }
        );
      } else {
        queueEmbed.setFields(
          {
            name: 'Queue Empty!',
            value: stripIndents`
            No songs found for ${guild.name}! 
            Add songs by URL: /music add (url)
            Search for a song: /music search [keywords]`
          }
        );
      };
      return queueEmbed;
    };
    function resourceGenerator(input, { metadata = {}, type, volume }) {
      const source = createAudioResource(input, {
        metadata: (metadata) ? metadata : undefined,
        inlineVolume: true, inputType: (type) ? type : undefined
      });
      if (source.volume) {
        source.volume.setVolume(volume || 0.2);
      };
      return resource;
    };
    async function playSong() {
      // TODO: play/load song code here.
      if (!music.queue[0] || !music.queue.length) return undefined;
      let { title, duration, type, url, thumbnail } = queue[0];
      track = { title: title, duration, thumbnail };
      const data = await playdl.stream(url);
      const source = resourceGenerator(data.stream, {
        metadata: { title: title }, type: source.type, volume: volume
      });
      return source;
    };
    async function nextSong() {
      // shifts queue one before playing new song.
      music.queue.shift(); track = {};
      resource = await playSong(song);
      if (!resource) autoplay = false;
      if (!player) player = newPlayer();
      player.play(resource);
    };
    collector = channel.createMessageComponentCollector();
    if (connection) {
      connection.on('stateChange', (oldState, newState) => {
        logger.debug("AudioPlayer state changed!");
        logger.debug(`${oldState.status} -> ${newState.status}`);
      });
    };
    if (player) {
      player.on(Playing, () => {
        logger.debug(`Now playing ${(track) ? track.title : 'no_title'}`);
      });
      player.on(Idle, async () => {
        if (autoplay) {
          await nextSong();
        } else {
          logger.debug('AudioPlayer stopped. Autoplay disabled.');
        };
      });
      player.on(Paused, () => {
        logger.debug("AudioPlayer paused by user.");
      });
      player.on(AutoPaused, () => {
        logger.debug("AudioPlayer paused (auto)");
      });
      player.on('stateChange', (oldState, newState) => {
        logger.debug("AudioPlayer state changed!");
        logger.debug(`${oldState.status} -> ${newState.status}`);
      });
    };
    if (collector) {
      if (!player) player = newPlayer();
      collector.on('collect', async (interact) => {
        await interact.deferUpdate();
        const refreshPlayer = async () => {
          await interaction.editReply({ components: [playerCtrlBtns1, playerCtrlBtns2], embeds: [createPlayerEmbed()] });
        };
        switch (interact.customId) {
          case 'play':
            resourceGenerator()
            player.play();
            refreshPlayer(); break;
          case 'pause':
            player.pause();
            refreshPlayer(); break;
          case 'stop':
            if (player) { player.stop(); player = null };
            await refreshPlayer();
            break;
          case 'skip':
            await nextSong();
            refreshPlayer(); break;
          case 'player':
            await refreshPlayer(); break;
          case 'vol+':
            volume = (volume < 1) ? volume + 0.05 : 1;
            if (resource && resource.volume) resource.volume.setVolume(volume);
            await refreshPlayer(); break;
          case 'vol-':
            volume = (volume > 0) ? volume - 0.05 : 0.05;
            if (resource && resource.volume) resource.volume.setVolume(volume);
            await refreshPlayer(); break;
          case 'vclink':
            if (!connection) {
              logger.debug("Connecting to user's voice channel.");
              try {
                if (!member.voice.channel) {
                  interaction.followUp({
                    content: "You are not in a voice channel! Please join one and try again.", ephemeral: true
                  });
                } else {
                  connection = joinVoiceChannel({
                    channelId: member.voice.channelId,
                    guildId: guild.id,
                    adapterCreator: guild.voiceAdapterCreator,
                  });
                };
              } catch (error) {
                logger.error("Failed to bind to voice channel!");
                logger.error(error); logger.debug(error.stack);
              };
            } else {
              logger.debug("Disconnecting from voice channel.");
              connection.destroy(); connection = null;
            };
            break;
          case 'queue':
            await interact.editReply({ components: [musicQueueBtns], embeds: [createQueueEmbed()] });
            break;
          case 'closeplayer':
            if (collector) collector.stop();
            break;
          default:
          // ..
        };
        await wait(1_000);
      });
      collector.on('end', async () => {
        await interaction.editReply({ components: [], content: "Closing player menu...", embeds: [] });
        await wait(3_000); await interaction.deleteReply();
      });
    };
    switch (subcmd) {
      case 'add':
        await interaction.editReply({ embeds: [] });
        break;
      case 'player':
        await interaction.editReply({
          components: [playerCtrlBtns1, playerCtrlBtns2],
          embeds: [createPlayerEmbed(channel)]
        });
        break;
      case 'search':
        await interaction.editReply({
          components: [],
          embeds: []
        });
        break;
    };
  }
};