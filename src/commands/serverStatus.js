const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const { executeStatement, executeQuery } = require('../utils/database/sqliteHandler');
const { queryBattleMetrics } = require('../utils/query/battlemetricsQuery');
const { emojiForStatus, capitalizeFirstLetter, getOrdinalSuffix } = require('../utils/functions');

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
};

const setStatusBreakdown = (guildId, channelId, bmId) => {
    if (!statusBreakdown[guildId]) {
        statusBreakdown[guildId] = {};
    }

    statusBreakdown[guildId][channelId] = bmId;
};

const howManyObservedServers = (channelBreakdown) => {
    const uniqueServers = new Set(Object.values(channelBreakdown));
    return uniqueServers.size;
};

const listBMids = () => {
    let newTable = {};

    for (let outerKey in statusBreakdown) {
        for (let innerKey in statusBreakdown[outerKey]) {
            newTable[statusBreakdown[outerKey][innerKey]] = {};
        }
    }

    return newTable;
}

const serverEmbedAndButtons = (bmid, data) => {
    const Embed = new EmbedBuilder()
    .setTitle(data.attributes.name)
    .setColor(16316405)
    .setDescription(
       `**__Status:__ ${emojiForStatus(data.attributes.status)} ${capitalizeFirstLetter(data.attributes.status)}**`
    )
    .addFields(
        { name: "Rank:", value: getOrdinalSuffix(data.attributes.rank), inline: true},
        { name: "Players:", value: `${data.attributes.players}${data.attributes.details.squad_publicQueue > 0 ? `(+${data.attributes.details.squad_publicQueue + data.attributes.details.squad_reservedQueue})` : ""}/${data.attributes.maxPlayers}`, inline: true },
        { name: "Layer:", value: data.attributes.details.map, inline: true }
    );

    const BMLink = new ButtonBuilder()
        .setLabel('Battlemetrics page')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://www.battlemetrics.com/servers/postscriptum/${bmid}`);

    const row = new ActionRowBuilder()
        .addComponents(BMLink);

    return {
        embeds: [Embed],
        components: [row]
    }
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
    async setup_command(client) {
        const DBbreakdown = await executeQuery('SELECT `guild`, `channels` FROM `server-status-channels`;', [], 'all');

        DBbreakdown.forEach(element => {
            let { guild, channels } = element;
            channels = JSON.parse(channels);

            for (const [channel_id, bmID] of Object.entries(channels)) {
                setStatusBreakdown(guild, channel_id, bmID);
            }
        });

        setInterval(async () => {
            const queryList = listBMids();
        
            const promises = Object.keys(queryList).map(async (identifier) => {
                try {
                    let data = await queryBattleMetrics(`servers/${identifier}`);
                    data = data.data;
        
                    if (data.attributes.name.includes('discord')) {
                        const index = data.attributes.name.toLowerCase().indexOf('discord');
                        data.attributes.name = index !== -1 ? data.attributes.name.substring(0, index).trim() : data.attributes.name;
                    } else if (data.attributes.name.includes('gg/')) {
                        const index = data.attributes.name.toLowerCase().indexOf('gg/');
                        data.attributes.name = index !== -1 ? data.attributes.name.substring(0, index).trim() : data.attributes.name;
                    }
        
                    queryList[identifier] = serverEmbedAndButtons(identifier, data);
                } catch (err) {
                    logger.error(`Error processing ${identifier}:`, err);
                }
            });
        
            await Promise.all(promises);

            Object.keys(statusBreakdown).forEach((guild_id) => {
                const guild = client.guilds.cache.get(guild_id);
                if (!guild) {
                    logger.error('Guild not found:', guild_id);
                    return;
                }
            
                Object.keys(statusBreakdown[guild_id]).forEach((channel_id) => {
                    const channel = guild.channels.cache.get(channel_id);
            
                    if (!channel || !channel.isTextBased()) {
                        logger.error('Channel not found or is not a text-based channel:', guild.name, guild_id, channel_id);
                        return;
                    }
            
                    channel.messages.fetch({ limit: 100 })
                        .then(messages => {
                            const botMessages = messages.filter(msg => msg.author.id === client.user.id);
                            
                            if (botMessages.size > 0) {
                                const lastBotMessage = botMessages.first();
                                lastBotMessage.edit(queryList[statusBreakdown[guild_id][channel_id]]);
                            } else {
                                channel.send(queryList[statusBreakdown[guild_id][channel_id]]);
                            }
                        })
                        .catch(err => {
                            logger.error('Unable to handle the message send for', guild.name, guild_id, channel_id, err);
                        });
                });
            });   
        
        }, 1000 * 10);
    },
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