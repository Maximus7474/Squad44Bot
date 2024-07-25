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
        .addSubcommand(subcommand => /* Add a Clan */
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
                    option.setName('language')
                        .setDescription('Main language of the clan')
                        .setRequired(true)
                        .setChoices(
                            {name: "english", value: "en"},
                            {name: "french", value: "fr"},
                            {name: "german", value: "de"},
                            {name: "chinese", value: "cn"},
                            {name: "spanish", value: "es"},
                            {name: "russian", value: "ru"},
                            {name: "arabic", value: "ar"},
                            {name: "portuguese", value: "pt"},
                            {name: "hindi", value: "hi"},
                            {name: "japanese", value: "ja"},
                            {name: "korean", value: "ko"},
                            {name: "italian", value: "it"},
                            {name: "international", value: "intl"}
                        )
                )
                .addStringOption(option => 
                    option.setName('image').setDescription('A direct link to their logo/seal/icon').setRequired(false)
                )
        )
        .addSubcommand(subcommand => /* Delete a Clan */
            subcommand.setName("delete")
                .setDescription("Deleta a clan from the Database")
                .addStringOption(option => 
                    option.setName('tag').setDescription('The clans game Tag (without brackets, case sensitive)').setRequired(false)
                )
                .addStringOption(option => 
                    option.setName('name').setDescription('The clans full name (case sensitive)').setRequired(false)
                )
                .addStringOption(option => 
                    option.setName('id').setDescription('The DB index of the clan').setRequired(false)
                )
        )
        .addSubcommandGroup(group => /* Handle Link Updates */
            group.setName('update_links')
                .setDescription('Update a clans secondary links')
                .addSubcommand(subcommand => /* Add a link */
                    subcommand.setName('add')
                        .setDescription('Add a new link to the clan')
                        .addStringOption(option =>
                            option.setName('tag')
                                .setDescription('The clans Tag (without brackets, case sensitive)')
                                .setRequired(true)
                        )
                        .addStringOption(option =>
                            option.setName('name')
                                .setDescription('A name for the link, short text title')
                                .setRequired(true)
                        )
                        .addStringOption(option =>
                            option.setName('link')
                                .setDescription('The link to add')
                                .setRequired(true)
                        )
                )
                .addSubcommand(subcommand => /* View current links */
                    subcommand.setName('view')
                        .setDescription('View the current links of a clan')
                        .addStringOption(option =>
                            option.setName('tag')
                                .setDescription('The clans Tag (without brackets, case sensitive)')
                                .setRequired(true)
                        )
                )
                .addSubcommand(subcommand => /* Remove a link */
                    subcommand.setName('remove')
                        .setDescription('Remove a link from the clan')
                        .addStringOption(option =>
                            option.setName('tag')
                                .setDescription('The clans Tag (without brackets, case sensitive)')
                                .setRequired(true)
                        )
                        .addStringOption(option =>
                            option.setName('name')
                                .setDescription('The name/title of the link to delete')
                                .setRequired(false)
                        )
                        .addStringOption(option =>
                            option.setName('id')
                                .setDescription('The id of the stored link to delete')
                                .setRequired(false)
                        )
                )
        )
        .addSubcommandGroup(group => /* Handle Server IDs Updates */
            group.setName('update_servers')
                .setDescription('Update a clans server list')
                .addSubcommand(subcommand => /* Add a server */
                    subcommand.setName('add')
                        .setDescription('Add a new link to the clan')
                        .addStringOption(option =>
                            option.setName('tag')
                                .setDescription('The clans Tag (without brackets, case sensitive)')
                                .setRequired(true)
                        )
                        .addStringOption(option =>
                            option.setName('name')
                                .setDescription('A name for the server')
                                .setRequired(true)
                        )
                        .addStringOption(option =>
                            option.setName('id')
                                .setDescription('The battlemetrics ID of the server')
                                .setRequired(true)
                        )
                )
                .addSubcommand(subcommand => /* View current servers */
                    subcommand.setName('view')
                        .setDescription('View the current list of servers of a clan')
                        .addStringOption(option =>
                            option.setName('tag')
                                .setDescription('The clans Tag (without brackets, case sensitive)')
                                .setRequired(true)
                        )
                )
                .addSubcommand(subcommand => /* Remove a server */
                    subcommand.setName('remove')
                        .setDescription('Remove a server from the clan')
                        .addStringOption(option =>
                            option.setName('tag')
                                .setDescription('The clans Tag (without brackets, case sensitive)')
                                .setRequired(true)
                        )
                        .addStringOption(option =>
                            option.setName('name')
                                .setDescription('The name/title of the server to delete')
                                .setRequired(false)
                        )
                        .addStringOption(option =>
                            option.setName('id')
                                .setDescription('The id of the stored server to delete')
                                .setRequired(false)
                        )
                )
        )
        .addSubcommandGroup(group => /* Update a Clans details */
            group.setName('update')
                .setDescription('Update a information on a clan')
                .addSubcommand(subcommand => /* Update Name */
                    subcommand.setName('name')
                        .setDescription('Update a clans name')
                        .addStringOption(option =>
                            option.setName('tag')
                                .setDescription('The clans Tag (without brackets, case sensitive)')
                                .setRequired(true)
                        )
                        .addStringOption(option =>
                            option.setName('name')
                                .setDescription('New name of the clan')
                                .setRequired(true)
                        )
                )
                .addSubcommand(subcommand => /* Update Image */
                    subcommand.setName('image')
                        .setDescription('Update a clans seal')
                        .addStringOption(option =>
                            option.setName('tag')
                                .setDescription('The clans Tag (without brackets, case sensitive)')
                                .setRequired(true)
                        )
                        .addStringOption(option =>
                            option.setName('image')
                                .setDescription('The url of the new image')
                                .setRequired(true)
                        )
                )
                .addSubcommand(subcommand => /* Update Invite */
                    subcommand.setName('invite')
                        .setDescription('Update a clans discord invite')
                        .addStringOption(option =>
                            option.setName('tag')
                                .setDescription('The clans Tag (without brackets, case sensitive)')
                                .setRequired(true)
                        )
                        .addStringOption(option =>
                            option.setName('invite')
                                .setDescription('The new invite link')
                                .setRequired(true)
                        )
                )
                .addSubcommand(subcommand => /* Update Description */
                    subcommand.setName('description')
                        .setDescription('Update a clans description')
                )
        )
        .addSubcommandGroup(group => /* Clan Rep handling Commands */
            group
            .setName("clan_rep")
            .setDescription("Handle Clan Reps")
            .addSubcommand(subcommand => 
                subcommand.setName("add")
                    .setDescription("Add a clan Rep to a Clan")
                    .addStringOption(option => 
                        option.setName('tag').setDescription('The clans game Tag (without brackets)').setRequired(true)
                    )
                    .addUserOption(option => 
                        option.setName('rep').setDescription('The clan rep to add').setRequired(true)
                    )
            )
            .addSubcommand(subcommand => 
                subcommand.setName("remove")
                    .setDescription("Remove a Clan Rep from a clan")
                    .addStringOption(option => 
                        option.setName('tag').setDescription('The clans game Tag (without brackets)').setRequired(true)
                    )
                    .addUserOption(option => 
                        option.setName('rep').setDescription('The clan rep to remove').setRequired(true)
                    )
            )
        ),
    async execute(client, interaction) {
        const group = interaction.options._group;
        const subcommand = interaction.options._subcommand;

        console.log(interaction.options)

        if (group === null && subcommand === 'add') {
            await interaction.deferReply({ephemeral: true});

            const tag = interaction.options.getString('tag');
            const name = interaction.options.getString('name');
            const language = interaction.options.getString('language');
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
                'INSERT INTO `game-clans` (tag, fullName, serverInvite, seal, language, added_by) VALUES (?, ?, ?, ?, ?, ?);',
                [
                    tag, name, invite, image, language, `${user.username} (${user.id})`
                ]
            ).then(index => {
                const Embed = new EmbedBuilder()
                    .setTitle("New clan added")
                    .setColor(16316405)
                    .setDescription(`- [${tag}] ${name} was added to the at the index ${index}\n- Discord invite: ${invite}`)
                    .setFooter({text: "If the image doesn't display as thumbnail the url is incorrect."})
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
        } else if (group === null && subcommand === 'delete') {

            const tag = interaction.options.getString('tag');
            const name = interaction.options.getString('name');
            const id = interaction.options.getString('id');
            const { user } = interaction;

            if (tag === null && name === null && id === null) {
                const Embed = new EmbedBuilder()
                    .setTitle("Unable to delete")
                    .setColor(12779520)
                    .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }))
                    .setDescription("You need to provide at least one argument.");

                return interaction.reply({content:``, embeds: [Embed], ephemeral: true});
            }
            await interaction.deferReply({ephemeral: true});

            const result = await executeQuery(`SELECT COUNT(tag) as lines FROM \`game-clans\` WHERE ${tag ? "tag" : name ? "name" : "id"} = ?;`, [tag ? tag : name ? name : id]);

            if (result.lines !== 1) {
                const Embed = new EmbedBuilder()
                    .setTitle("Unable to delete")
                    .setColor(12779520)
                    .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }))
                    .setDescription(`The given \`${tag ? "tag" : name ? "name" : "id"}\` ${result.lines > 1 ? "gave to many results." : "wasn't found."}`);

                return interaction.editReply({content:``, embeds: [Embed], ephemeral: false});
            }

            executeStatement(`DELETE FROM \`game-clans\` WHERE ${tag ? "tag" : name ? "name" : "id"} = ?;`, [tag ? tag : name ? name : id])
                .then(status => {
                    logger.info(`Delete request for ${tag ? "tag" : name ? "name" : "id"} with value ${tag ? tag : name ? name : id} ${status === 1 ? "succeeded by" : "failed by"} ${user.username} (${user.id})`)

                    const Embed = new EmbedBuilder()
                        .setTitle(status === 1 ? "Clan Deleted" : "Unable to delete")
                        .setColor(16316405)
                        .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }))
                        .setDescription(
                            status === 1 ?
                            `The clan under the ${tag ? "tag" : name ? "name" : "id"}: \`${tag ? tag : name ? name : id}\` was deleted\n-# Status code: \`${status}\`` :
                            `Unable to delete the requested clan.\n-# Status code: \`${result}\``
                        );
    
                    return interaction.editReply({content:``, embeds: [Embed], ephemeral: true})
                })
        } else if (group === "clan_rep" && (subcommand === 'add' || subcommand === 'remove')) {
            await interaction.deferReply({ephemeral: true});

            const tag = interaction.options.getString('tag');
            const rep = interaction.options.getUser('rep');

            const DBdata = await executeQuery('SELECT `id`, `clanReps` FROM `game-clans` WHERE tag = ?;', [tag]);

            if (DBdata === undefined || typeof DBdata.id !== "number") {
                const Embed = new EmbedBuilder()
                    .setTitle("Unable to add clan rep")
                    .setColor(12779520)
                    .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }))
                    .setDescription(`There already is no clan with the Tag \`[${tag}]\``);

                return interaction.editReply({content:``, embeds: [Embed], ephemeral: false});
            }

            let clanReps = JSON.parse(DBdata.clanReps)
            if (
                (subcommand === 'add' && clanReps.includes(rep.id)) ||
                (subcommand === 'remove' && !clanReps.includes(rep.id))
            ) {
                const Embed = new EmbedBuilder()
                    .setTitle(subcommand === 'add' ? "Unable to add clan rep" : "Unable to remove clan rep")
                    .setColor(12779520)
                    .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }))
                    .setDescription(subcommand === 'add' ? `<@${rep.id}> is already a representatif of \`[${tag}]\`` : `<@${rep.id}> isn't a representatif of \`[${tag}]\``);

                return interaction.editReply({content:``, embeds: [Embed], ephemeral: false});
            }

            if (subcommand === 'add') clanReps.push(rep.id);
            if (subcommand === 'remove') clanReps.splice(clanReps.indexOf(rep.id), 1);

            executeStatement('UPDATE `game-clans` SET `clanReps` = ? WHERE `id` = ?', [JSON.stringify(clanReps), DBdata.id])
                .then(result => {
                    logger.info(`${rep.username} (${rep.id}) has been ${subcommand === 'add' ? 'added as clan rep to' : 'removed from' }  ${tag}`, result);

                    const Embed = new EmbedBuilder()
                        .setTitle("Clan Reps updated")
                        .setColor(16316405)
                        .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }))
                        .setDescription(
                            subcommand === 'add' ?
                            `<@${rep.id}> has been added as clan rep to [${tag}]\nCurrent List:\n> ${clanReps.map(id => `<@${id}>`).join(', ')}\n-# Status code: \`${result}\`` :
                            `<@${rep.id}> has been removed from [${tag}]\nCurrent List:\n> ${clanReps.map(id => `<@${id}>`).join(', ')}\n-# Status code: \`${result}\``
                        );
    
                    return interaction.editReply({content:``, embeds: [Embed], ephemeral: true})
                }).catch(err => {
                    logger.error(`Unable to add ${rep.username} (${rep.id}) as clan rep for [${tag}] to the DB by ${rep.username}`, err)
    
                    const Embed = new EmbedBuilder()
                        .setTitle("ERROR, unable to add clan rep")
                        .setColor(12779520)
                        .setDescription(`Error message:\n\`\`\`md\n${err}\n\`\`\``);
    
                    return interaction.editReply({content:``, embeds: [Embed], ephemeral: false})
                });
        } else if (group === "update") {
            if (subcommand === 'name') console.log()
            return interaction.reply({content:`Haven't build this thing yet!`,ephemeral :true})
        } else {
            return interaction.reply({content:`Haven't build this thing yet!`,ephemeral :true})
        }
    }
}