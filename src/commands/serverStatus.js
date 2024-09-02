const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const { executeStatement, executeQuery } = require('../utils/database/sqliteHandler');
const { queryBattleMetrics } = require('../utils/query/battlemetricsQuery');

const log = new require('../utils/logger.js');
const logger = new log("Server Status");

const statusBreakdown = {};

const extractBMId = (UrlOrId) => {
    const urlPattern = /^(?:https?:\/\/)?(?:www\.)?battlemetrics\.com\/servers\/postscriptum\/(\d+)$/;

    if (typeof UrlOrId === 'string') {
        const match = UrlOrId.match(urlPattern);
        if (match) {
            return match[1];
        }
    }

    if (typeof UrlOrId === 'number' || (typeof UrlOrId === 'string' && !isNaN(Number(UrlOrId)))) {
        const id = Number(UrlOrId);
        if (id > 0) {
            return id.toString();
        }
    }

    return null;
}

const setStatusBreakdown = (guildId, channelId, bmId) => {
    if (!statusBreakdown[guildId]) {
        statusBreakdown[guildId] = {};
    }

    statusBreakdown[guildId][channelId] = bmId;
};

const howManyObservedServers = (channelBreakdown) => {
    const uniqueServers = new Set(Object.values(channelBreakdown));
    return uniqueServers.size;
}

module.exports = {
    guildOnly: false,
    register_command: new SlashCommandBuilder()
        .setName('setup_status')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .setDescription('Set up a fixed message which will show the status of your server!')
        .addSubcommand(subcommand =>
            subcommand.setName("add")
                .setDescription("Add a channel for a server display")
                .addChannelOption(option =>
                    option.setName('channel').setDescription('Then destined channel to show').setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('server').setDescription('The battlemetrics ID or link of the server').setRequired(true)
                )
        ),
    async execute(client, interaction) {
        const subcommand = interaction.options._subcommand;
        const { user, guild } = interaction;

        const DBentry = await executeQuery('SELECT * FROM `server-status-channels` WHERE `guild` = ?;', [guild.id]);

        if (DBentry === undefined) {
            const embed = new EmbedBuilder()
                .setTitle('Impossible')
                .setDescription('This guild hasn\'t been authorized to display server a status.\nPlease join the discord server and open a ticket to request this feature.')
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }));

            const joinGuildButton = new ButtonBuilder()
                .setLabel('Join Guild')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.gg/MFhkJhxpHG');

            const row = new ActionRowBuilder()
                .addComponents(joinGuildButton);
                
            return interaction.reply({
                embeds: [embed],
                components: [row],
                ephemeral: false
            });
        }

        if (subcommand === 'add') {
            const bmId = extractBMId(interaction.options.getString('server'));
            const channel = interaction.options.getString('channel')
            
            if (typeof bmId !== 'string') {
                const embed = new EmbedBuilder()
                    .setTitle('Unknown server')
                    .setDescription(`The provided value for the server's Battlemetrics ID is invalid, please check it and rerun the command.`)
                    .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }));
                
                return interaction.reply({
                    embeds: [embed],
                    ephemeral: false
                });
            }

            if (statusBreakdown[guild.id] && statusBreakdown[guild.id][channel.id] !== undefined) {
                const embed = new EmbedBuilder()
                    .setTitle('Impossible')
                    .setDescription(`The channel ${channel.mention} already has a server associated to it.\n-# This will be integrated at a later date.`)
                    .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }));
                
                return interaction.reply({
                    embeds: [embed],
                    ephemeral: false
                });
            }

            if (!(howManyObservedServers(DBentry.channels) < DBentry.limit)) {
                const embed = new EmbedBuilder()
                    .setTitle('Impossible')
                    .setDescription(`You have already reached your limit of servers for this guild.\nPlease open a ticket to ask for more slots.`)
                    .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }));
                
                const joinGuildButton = new ButtonBuilder()
                    .setLabel('Join Guild')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord.gg/MFhkJhxpHG');
    
                const row = new ActionRowBuilder()
                    .addComponents(joinGuildButton);
                    
                return interaction.reply({
                    embeds: [embed],
                    components: [row],
                    ephemeral: false
                });
            }

            await interaction.deferReply();

            queryBattleMetrics(`servers/${bmId}`)
            .then((data) => {

                if (data === null) {
                    return interaction.editReply({content: `Invalid Server ID, Server was not found.`, ephemeral :true});
                }

                data = data.data;

                if (data.relationships.game.data.id !== 'postscriptum') {
                    return interaction.editReply({content: `Invalid Server ID, game is different: ${data.relationships.game.data.id}`, ephemeral :true});
                }

                setStatusBreakdown(guild.id, channel.id, bmId);

                const embed = new EmbedBuilder()
                    .setAuthor({name: guild.name, iconURL: guild.iconURL()})
                    .setTitle('Success')
                    .setColor(16316405)
                    .setDescription(
                        `The server \`${data.attributes.name}\` has been added to the status system and will be show in ${channel.mention}`
                    );

                return interaction.editReply({embeds :[embed], ephemeral :true});
            })
            .catch((error) => {
                logger.error("Couldn't execute query callback", error)

                const Embed = new EmbedBuilder()
                    .setTitle("An error occured")
                    .setColor('Red')
                    .setDescription(`A report has been submitted:
                        \`\`\`md\n${error}\n\`\`\``
                    );
                return interaction.editReply({embeds:[Embed], ephemeral: true})
            })
        }
    }
}