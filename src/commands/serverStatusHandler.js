const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, EmbedBuilder } = require('discord.js');

const { executeStatement, executeQuery } = require('../utils/database/sqliteHandler');

const isInGuild = (client, guild_id) => {
    return client.guilds.cache.get(guild_id) || false;
}

module.exports = {
    guildOnly: true,
    register_command: new SlashCommandBuilder()
        .setName('status_permissions')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .setDescription('Handle permissions to certain guilds to allow server statuses')
        .addSubcommand(subcommand =>
            subcommand.setName("add")
                .setDescription("Add a guild to the Database")
                .addStringOption(option => 
                    option.setName('guild_id').setDescription('The server id').setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('limit').setDescription('The amount of different servers they can use').setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName("remove")
                .setDescription("Remove a server from the Database")
                .addStringOption(option => 
                    option.setName('guild_id').setDescription('The server id').setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName("limit")
                .setDescription("Change the server limit from a guild")
                .addStringOption(option => 
                    option.setName('guild_id').setDescription('The server id').setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('limit').setDescription('The amount of different servers they can use').setRequired(true)
                )
        ),
    async execute(client, interaction) {
        const subcommand = interaction.options._subcommand;
        const guild_id = interaction.options.getString('guild_id');
        const { user } = interaction;

        const DBentry = await executeQuery('SELECT * FROM `server-status-channels` WHERE `guild` = ?;', [guild_id]);

        if (subcommand === 'add' && DBentry) {
            return interaction.reply({
                content: `The guild with id: \`${guild_id}\` is already referenced in the Database.`,
                ephemeral: true
            });
        } else if (subcommand !== 'add' && DBentry === undefined) {
            return interaction.reply({
                content: `The guild with id: \`${guild_id}\` does not exist in the Database.`,
                ephemeral: true
            });
        }

        if (subcommand === 'add') {
            const guild = isInGuild(client, guild_id);
            const limit = interaction.options.getInteger('limit') || 1;

            executeStatement(
                'INSERT INTO `server-status-channels` (`guild`, `guild_name`, `limit`, `added_by`) VALUES (?, ?, ?, ?);',
                [guild_id, guild ? guild.name : 'N/A', limit, user.username]
            ).then(response => {

                const embed = new EmbedBuilder()
                    .setTitle('Added a new guild')
                    .setColor(16316405)
                    .setDescription(
                        `Status authorization has been given to server with id \`${guild_id}\` ${guild ? ` - \`${guild.name}\`` : '(isn\'t on the server)'}\nServer limit has been set to: ${limit}\n-# Response: \`${response}\``
                    )
                    .setThumbnail(guild ? guild.iconURL() : client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }));

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: false
                });

            }).catch(err => {

                const embed = new EmbedBuilder()
                    .setTitle('Impossible to add')
                    .setColor('Red')
                    .setDescription(
                        `Error Text:\n\`\`\`${err}\`\`\``
                    )

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: false
                });

            });
        } else if (subcommand === 'remove') {
            executeStatement('DELETE * FROM `server-status-channels` WHERE guild = ?;', [guild_id])
            .then(response => {
                const embed = new EmbedBuilder()
                    .setTitle('Deleted the guild')
                    .setColor(16316405)
                    .setDescription(
                        `Succesfuly executed the request.\n-# Response: \`${response}\``
                    )
                    .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }));

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: false
                });
            }).catch(err => {

                const embed = new EmbedBuilder()
                    .setTitle('Impossible to remove')
                    .setColor('Red')
                    .setDescription(
                        `Error Text:\n\`\`\`${err}\`\`\``
                    )

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: false
                });

            });
        } else if (subcommand === 'limit') {
            executeStatement('DELETE * FROM `server-status-channels` WHERE guild = ?;', [guild_id])
            .then(response => {
                const embed = new EmbedBuilder()
                    .setTitle('Deleted the guild')
                    .setColor(16316405)
                    .setDescription(
                        `Succesfuly executed the request.\n-# Response: \`${response}\``
                    )
                    .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }));

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: false
                });
            }).catch(err => {

                const embed = new EmbedBuilder()
                    .setTitle('Impossible to remove')
                    .setColor('Red')
                    .setDescription(
                        `Error Text:\n\`\`\`${err}\`\`\``
                    )

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: false
                });

            });
        }
    }
}