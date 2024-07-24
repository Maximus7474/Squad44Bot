const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, EmbedBuilder } = require('discord.js');

const { executeStatement, executeQuery } = require('../utils/database/sqliteHandler');

const log = new require('../utils/logger.js');
const logger = new log("Clan Handler");

const cleanInvite = (url) => {
    if (!url.includes(".gg/") && !url.includes('discord.com/invite/')) return false;

    const inviteID = url.split('/')[url.split('/').length - 1]

    if (inviteID.length < 2) return false;
    if (!(/^[a-zA-Z0-9-_]+$/.test(inviteID))) return false;

    return `https://discord.gg/${inviteID}`
}

module.exports = {
    guildOnly: true,
    register_command: new SlashCommandBuilder()
        .setName('clan_handler')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .setDescription('Handle, Add or Delete clans in the DB')
        .addSubcommand(subcommand => 
            subcommand.setName("add")
                .setDescription("Add a clan to the Database")
                .addStringOption(option => 
                    option.setName('tag').setDescription('The clans game Tag (without brackets)').setRequired(true)
                )
                .addStringOption(option => 
                    option.setName('name').setDescription('The clans full name').setRequired(true)
                )
                .addStringOption(option => 
                    option.setName('invite').setDescription('Their discord server invite').setRequired(true)
                )
                .addStringOption(option => 
                    option.setName('image').setDescription('A direct link to their logo/seal/icon').setRequired(false)
                )
        ),
    async execute(client, interaction) {
        const subcommand = interaction.options._subcommand;

        if (subcommand === 'add') {
            await interaction.deferReply({ephemeral: true});

            const tag = interaction.options.getString('tag');
            const name = interaction.options.getString('name');
            const invite = cleanInvite(interaction.options.getString('invite'));
            const image = interaction.options.getString('image') || null;
            const { user } = interaction;

            if (!invite) return interaction.editReply({content:`The provided invitation is incorrect, it must be a valid invitation!`,ephemeral :true});

            const exists = await executeQuery('SELECT COUNT(tag) AS count FROM `game-clans` WHERE tag = ?;', [tag]);
            if (exists.count > 0) {
                const Embed = new EmbedBuilder()
                    .setTitle("Unable to add clan with the same tag")
                    .setColor(12779520)
                    .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }))
                    .setDescription(`There already is a clan with the Tag \`[${tag}]\``);

                return interaction.editReply({content:``, embeds: [Embed], ephemeral: false})
            }

            executeStatement(
                'INSERT INTO `game-clans` (tag, fullName, serverInvite, seal, added) VALUES (?, ?, ?, ?, ?);',
                [
                    tag, name, invite, image, `${user.username} (${user.id})`
                ]
            ).then(index => {
                const Embed = new EmbedBuilder()
                    .setTitle("New clan added")
                    .setColor(16316405)
                    .setDescription(`[${tag}] ${name} was added to the database with at index ${index}\nDiscord invite: ${invite}`)
                    .setFooter("If the image doesn't display as thumbnail the url is incorrect.")
                    .setThumbnail(image);

                return interaction.editReply({content:``, embeds: [Embed], ephemeral: true})
            }).catch(err => {
                logger.error(`Unable to add [${tag}] to the DB by ${user.username}`, err)

                const Embed = new EmbedBuilder()
                    .setTitle("ERROR, unable to add clan")
                    .setColor(12779520)
                    .setDescription(`Error message:\n\`\`\`md\n${err}\n\`\`\``);

                return interaction.editReply({content:``, embeds: [Embed], ephemeral: false})
            })
        } else {
            return interaction.reply({content:`Haven't build this thing yet!`,ephemeral :true})
        }
    }
}