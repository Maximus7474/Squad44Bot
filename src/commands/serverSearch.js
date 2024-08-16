const { SlashCommandBuilder } = require('@discordjs/builders');
const { queryBattleMetrics } = require('../utils/query/battlemetricsQuery');
const { EmbedBuilder } = require('discord.js');

const log = new require('../utils/logger.js');
const logger = new log("BattleMetrics API");

const getOrdinalSuffix = (n) => {
    const s = ["th", "st", "nd", "rd"],
          v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const findResemblance = (data, searchName) => {
    return data.data.filter(server => 
        server.attributes.name.toLowerCase().includes(searchName.toLowerCase())
    );
};

const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const emojiForStatus = (status) => {
    if (status === "online") return ":green_circle:";
    if (status === "offline") return ":red_circle:";
    if (status === "dead") return ":skull:";

    return ":grey_question:"
}

module.exports = {
    register_command: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Search for servers')
        .addSubcommand( subcommand =>
            subcommand
            .setName("top10")
            .setDescription("Return the top 10 servers")
        )
        .addSubcommand( subcommand =>
            subcommand
            .setName("top20")
            .setDescription("Return the top 20 servers")
        )
        .addSubcommand( subcommand =>
            subcommand
            .setName("search")
            .setDescription("Search for a specific server")
            .addStringOption(option => 
                option.setName('name')
                .setDescription("Server Name")
                .setRequired(true)
            )
        ),
    async execute(client, interaction) {
        const subcommand = interaction.options._subcommand;

        await interaction.deferReply();

        if (subcommand === 'top10') {
            queryBattleMetrics('servers?filter[game]=postscriptum&filter[status]=online&fields[server]=name,details,players,maxPlayers&sort=rank&page[size]=10')
                .then((data) => {
                    const Embed = new EmbedBuilder()
                        .setTitle("Current Top 10 Servers")
                        .setColor(16316405)
                        .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }))
                        .addFields(
                            data.data.map(
                                (data, index) => ({
                                    name: `${(index + 1)}. \`${data.attributes.name}\``,
                                    value: `> - Players: \`${data.attributes.players}/${data.attributes.maxPlayers}\`
                                            > - Layer: \`${data.attributes.details.map}\` ${data.attributes.details.modded ? "(**Modded Server**)": ""}`,
                                    inline: false
                                })
                            )
                        );

                    return interaction.editReply({embeds:[Embed],ephemeral :true})
                    
                })
                .catch((error) => {
                    const Embed = new EmbedBuilder()
                        .setTitle("An error occured")
                        .setColor('Red')
                        .setDescription(`A report has been submitted:
                            \`\`\`md\n${error}\n\`\`\``
                        );
                    return interaction.editReply({embeds:[Embed],ephemeral :true})
                });
        } else if (subcommand === 'top20') {
                queryBattleMetrics('servers?filter[game]=postscriptum&filter[status]=online&fields[server]=name,details,players,maxPlayers&sort=rank&page[size]=20')
                    .then((data) => {
                        let topRanking = "";
                        const rawList = data.data;

                        for (var i = 0; i < rawList.length; i++) {
                            topRanking += `${i + 1}. \`${rawList[i].attributes.name}\`\n`
                        }

                        const Embed = new EmbedBuilder()
                            .setTitle("Current Top 20 Servers")
                            .setColor(16316405)
                            .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }))
                            .setDescription(topRanking);
    
                        return interaction.editReply({embeds:[Embed],ephemeral :true})
                        
                    })
                    .catch((error) => {
                        const Embed = new EmbedBuilder()
                            .setTitle("An error occured")
                            .setColor('Red')
                            .setDescription(`A report has been submitted:
                                \`\`\`md\n${error}\n\`\`\``
                            );
                        return interaction.editReply({embeds:[Embed],ephemeral :true})
                    });
        } else if (subcommand === 'search' ) {
            const searchValue = interaction.options.getString('name');
            queryBattleMetrics('servers?filter[game]=postscriptum&fields[server]=name,players,maxPlayers&sort=rank&page[size]=50')
                .then((data) => {
                    const results = findResemblance(data, searchValue)

                    if (results.length === 1) {
                        queryBattleMetrics(`servers/${results[0].id}`)
                            .then((data) => {
                                data = data.data;

                                console.log("getServerInfo JSON.stringify", JSON.stringify(data, null, 4))

                                if (data.attributes.name.includes('discord')) {
                                    const index = data.attributes.name.toLowerCase().indexOf('discord');
                                    data.attributes.name = index !== -1 ? data.attributes.name.substring(0, index).trim() : data.attributes.name;
                                } else if (data.attributes.name.includes('gg/')) {
                                    const index = data.attributes.name.toLowerCase().indexOf('gg/');
                                    data.attributes.name = index !== -1 ? data.attributes.name.substring(0, index).trim() : data.attributes.name;
                                }

                                const Embed = new EmbedBuilder()
                                    .setTitle(data.attributes.name)
                                    .setColor(16316405)
                                    .setDescription(
                                       `> Status: ${emojiForStatus(data.attributes.status)} ${capitalizeFirstLetter(data.attributes.status)}
                                        > Rank: ${getOrdinalSuffix(data.attributes.rank)}
                                        > Players: \`${data.attributes.players}${data.attributes.details.squad_publicQueue > 0 ? `(+${data.attributes.details.squad_publicQueue + data.attributes.details.squad_reservedQueue})` : ""}/${data.attributes.maxPlayers}\`
                                        > Layer: ${data.attributes.details.map} ${data.attributes.details.modded ? "\n> Server has mods" : ""}
                                        > Password Protected: ${data.attributes.private}`
                                    );

                                    return interaction.editReply({embeds :[Embed], ephemeral :true})
                            })
                            .catch((error) => {
                                logger.error("Couldn't get server info from query")
                                const Embed = new EmbedBuilder()
                                    .setTitle("An error occured")
                                    .setColor('Red')
                                    .setDescription(`A report has been submitted:
                                        \`\`\`md\n${error}\n\`\`\``
                                    );
                                return interaction.editReply({embeds:[Embed], ephemeral: true})
                            })
                    } else {
                        const Embed = new EmbedBuilder()
                            .setTitle("Multiple Results")
                            .setColor(16750336)
                            .setDescription("Please precise your search with the following details or you can open the associated battle metrics page.")
                            .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }))
                            .addFields(
                                results.map(
                                    (data) => ({
                                        name: `${data.attributes.name}`,
                                        value: `>>> Players: ${data.attributes.players}/${data.attributes.maxPlayers}\n[Battlemetrics Page](https://www.battlemetrics.com/servers/postscriptum/${data.id})`,
                                        inline: false
                                    })
                                )
                            );
                        
                        return interaction.editReply({embeds:[Embed],ephemeral :true})
                    }
                })
                .catch((error) => {
                    const Embed = new EmbedBuilder()
                        .setTitle("An error occured")
                        .setColor('Red')
                        .setDescription(`A report has been submitted:
                            \`\`\`md\n${error}\n\`\`\``
                        );
                    return interaction.editReply({embeds:[Embed],ephemeral :true})
                });
        } else {
            return interaction.editReply({content:`Nothing to show!`,ephemeral :true})
        }
    }
}