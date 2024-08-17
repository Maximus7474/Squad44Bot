const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('@discordjs/builders');

const { executeQuery } = require('../utils/database/sqliteHandler');
const log = require('../utils/logger');
const logger = new log('View Clans');

const locales = require('../../data/localeList.json');

const formatLinks = (jsonstring) => {
    return JSON.parse(jsonstring)
        .map(link => `- [${link.title}](${link.link})`)
        .join('\n');
}

const formatServerIDs = (jsonstring) => {
    return JSON.parse(jsonstring)
        .map(server => `- [${server.title}](https://www.battlemetrics.com/servers/postscriptum/${server.id})`)
        .join('\n');
}

const formatClanReps = (jsonstring) => {
    return JSON.parse(jsonstring)
        .map(server => `- <@${server}>`)
        .join('\n');
}

const formatResultsList = (results) => {
    return results
        .map(element  => `- (${element.language || 'N/A'}) [${element.tag}] ${element.name}`)
        .join('\n');
}

const singleResultEmbed = (result) => {
    const links = formatLinks(result.otherLinks) || null;
    const servers = formatServerIDs(result.serverIDs) || null;
    const reps = formatClanReps(result.clanReps) || null;

    let fields = [];
    if (reps) fields.push({name: 'Clan Reps', value: reps, inline: false});
    if (links) fields.push({name: 'Links', value: links, inline: false});
    if (servers) fields.push({name: 'Servers', value: servers, inline: false});

    return new EmbedBuilder()
        .setTitle(`[${result.tag}] ${result.name}`)
        .setColor(16316405)
        .setDescription(`Discord Server: ${result.invite}${result.description !== null && result.description !== undefined ?`\n\n${result.description}` : ''}`)
        .addFields(...fields)
        .setThumbnail(result.seal || null);

}

const multipleResultResponse = (interaction, results) => {

    const Embed = new EmbedBuilder()
        .setTitle('Multiple results')
        .setColor(16316405)
        .setDescription(`Please select one from the drop down menu:\n\n${formatResultsList(results)}`)
        .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }))
        .setFooter({text: "This menu will timeout"});
    
    const options = results.map((result) => 
        new StringSelectMenuOptionBuilder()
            .setLabel(`[${result.tag}] ${result.name}`)
            .setValue(result.id.toString())
    );

    const dropDownMenu = new StringSelectMenuBuilder()
        .setCustomId('temp_clansearch_menu')
        .setPlaceholder('Select an option')
        .addOptions(options);

    const row = new ActionRowBuilder().addComponents(dropDownMenu);

    interaction.reply({ embeds: [Embed], components: [row], ephemeral: true });

    const filter = i => i.customId === 'temp_clansearch_menu' && i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 180000 });

    collector.on('collect', async i => {
        const selectedId = i.values[0];
        const selectedClan = results.find(result => result.id.toString() === selectedId);

        if (selectedClan) {
            await i.update({ content: ``, embeds: [singleResultEmbed(selectedClan)], components: [] });
        } else {
            await i.update({ content: 'Something went wrong. Please try again.', components: [], embeds: [] });
        }
    });

    collector.on('end', collected => {
        if (collected.size === 0) {
            interaction.editReply({ content: 'The selection timed out.', components: [], embeds: [] });
        }
    });
}

module.exports = {
    register_command: new SlashCommandBuilder()
        .setName('clans')
        .setDescription('Get information on a clan or search for one.')
        .addSubcommand(group =>
            group.setName('search')
                .setDescription('Search for a clan through it\'s name or tag')
                .addStringOption(option => 
                    option.setName('tag')
                        .setDescription('The clans tag (no brackets)')
                )
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('The clans name full or partial')
                )
                .addStringOption(option =>
                    option.setName('language')
                        .setDescription('Get a list of clans based on their main language')
                        .setChoices(...locales)
                )
        ),
    async execute(client, interaction) {
        const tag = interaction.options.getString('tag');
        const name = interaction.options.getString('name');
        const language = interaction.options.getString('language');

        if (tag === null && name === null && language === null) {
            const Embed = new EmbedBuilder()
                .setTitle('Missing arguments')
                .setColor(12779520)
                .setDescription('You need to specify either a tag or name to look for a clan');

            return interaction.reply({content:``, embeds: [Embed], ephemeral :true})
        }

        if (language) {
            executeQuery('SELECT * FROM `game-clans` WHERE language = ?;', [language], 'all')
                .then(results => {
                    if (results.length === 1) {
                        return interaction.reply({
                            embeds: [singleResultEmbed(results[1])],
                            ephemeral: true
                        });
                    } else if (results.length > 20) {
                        return interaction.reply({
                            content: `Please narrow the result parameters`,
                            ephemeral: true
                        });
                    } else {
                        multipleResultResponse(interaction, results);
                    }
                })
                .catch(err => logger.error(err));
        } else if (tag) {
            executeQuery('SELECT * FROM `game-clans` WHERE tag = ?;', [tag], 'get')
                .then(result => {
                    if (result) {
                        return interaction.reply({
                            embeds: [singleResultEmbed(result)],
                            ephemeral: true
                        })
                    } else {
                        return interaction.reply({
                            content: `No clans where found with the tag [${tag}]`,
                            ephemeral: true
                        })
                    }
                })
                .catch(err => logger.error(err));
        } else if (name) {
            executeQuery('SELECT * FROM `game-clans` WHERE name LIKE ?;', [`%${name}%`], 'all')
                .then(results => {
                    if (results.length === 1) {
                        return interaction.reply({
                            embeds: [singleResultEmbed(results[1])],
                            ephemeral: true
                        })
                    } else if (results.length > 20) {
                        return interaction.reply({
                            content: `Please narrow the result parameters`,
                            ephemeral: true
                        });
                    } else {
                        multipleResultResponse(interaction, results);
                    }
                })
                .catch(err => logger.error(err));
        } else {
            return interaction.reply({content:`Haven't build this thing yet!`,ephemeral :true})
        }
    }
}