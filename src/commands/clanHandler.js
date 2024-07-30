const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const { executeStatement, executeQuery } = require('../utils/database/sqliteHandler');

const ConfigManager = require('../utils/configManager');
const { locales } = ConfigManager.getConfig()

const log = new require('../utils/logger.js');
const logger = new log("Clan Handler");

const cleanInvite = (url) => {
    if (!url.includes(".gg/") && !url.includes('discord.com/invite/')) return false;

    const inviteID = url.split('/')[url.split('/').length - 1]

    if (inviteID.length < 2) return false;
    if (!(/^[a-zA-Z0-9-_]+$/.test(inviteID))) return false;

    return `https://discord.gg/${inviteID}`
}

const checkLink = (url) => {
    return url.startsWith('http') ? url : `https://${url}`;
}

const checkImageUrl = (url) => {
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|tiff|svg|ico)$/i;
    return imageExtensions.test(url);
}

async function openDescriptionEditorModal(interaction, defaultText) {
    const modal = new ModalBuilder()
        .setCustomId('temp_description_editor')
        .setTitle('Edit Your Text');

    const textInput = new TextInputBuilder()
        .setCustomId('text_input')
        .setLabel('Description')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Clan Description here...')
        .setValue(defaultText || '');

    const actionRow = new ActionRowBuilder().addComponents(textInput);

    modal.addComponents(actionRow);

    await interaction.showModal(modal);
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
                        .setChoices(...locales)
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
                            option.setName('link')
                                .setDescription('The link to delete')
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
                    subcommand.setName('seal')
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
                        .setDescription("Add a clan Rep to a Clan")
                        .addStringOption(option => 
                            option.setName('tag').setDescription('The clans game Tag (without brackets)').setRequired(true)
                        )
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
            .addSubcommand(subcommand => 
                subcommand.setName("view")
                    .setDescription("View the Clan Reps from a clan")
                    .addStringOption(option => 
                        option.setName('tag').setDescription('The clans game Tag (without brackets)').setRequired(true)
                    )
            )
        ),
    async execute(client, interaction) {
        const group = interaction.options._group;
        const subcommand = interaction.options._subcommand;

        const tag = interaction.options.getString('tag');
        const { user } = interaction;

        if (!(group === "update" && subcommand === 'description')) await interaction.deferReply({ephemeral: true});        

        if (group === null && subcommand === 'add') {

            const name = interaction.options.getString('name');
            const language = interaction.options.getString('language');
            const invite = cleanInvite(interaction.options.getString('invite'));
            const image = interaction.options.getString('image') || null;

            if (!invite) return interaction.editReply({content:`The provided invitation is incorrect, it must be a valid invitation!`,ephemeral :true});

            const exists = await executeQuery('SELECT COUNT(tag) AS count FROM `game-clans` WHERE tag = ?;', [tag], 'get');
            if (exists.count > 0) {
                const Embed = new EmbedBuilder()
                    .setTitle("Unable to add clan with the same tag")
                    .setColor(12779520)
                    .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }))
                    .setDescription(`There already is a clan with the Tag \`[${tag}]\``);

                return interaction.editReply({content:``, embeds: [Embed], ephemeral: false})
            }

            executeStatement(
                'INSERT INTO `game-clans` (tag, name, invite, seal, language, added_by) VALUES (?, ?, ?, ?, ?, ?);',
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

            const name = interaction.options.getString('name');
            const id = interaction.options.getString('id');
            const { user } = interaction;

            if (tag === null && name === null && id === null) {
                const Embed = new EmbedBuilder()
                    .setTitle("Unable to delete")
                    .setColor(12779520)
                    .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }))
                    .setDescription("You need to provide at least one argument.");

                return editReply({content:``, embeds: [Embed], ephemeral: true});
            }

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

            const rep = interaction.options.getUser('rep');

            const DBdata = await executeQuery('SELECT `id`, `clanReps` FROM `game-clans` WHERE tag = ?;', [tag], 'get');

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
        } else if (group === "clan_rep" && subcommand === 'view') {
            
            const clanReps = await executeQuery('SELECT `clanReps` FROM `game-clans` WHERE tag = ?;', [tag], 'get');
            let Embed;

            if (clanReps && clanReps.clanReps !== '[]') {
                Embed = new EmbedBuilder()
                    .setTitle(`Clan Reps for ${tag}`)
                    .setDescription(JSON.parse(clanReps.clanReps).map(id => `- <@${id}>\n`).join(', '))
                    .setColor(16316405)
                    .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }));
            } else if (clanReps && clanReps.clanReps === '[]') {
                Embed = new EmbedBuilder()
                    .setTitle(`No Clan Reps for ${tag}`)
                    .setColor(16316405)
                    .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }));
            } else {
                Embed = new EmbedBuilder()
                    .setTitle(`No Clan found for ${tag}`)
                    .setColor(12779520)
                    .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }));
            }

            await interaction.editReply({content:``, embeds: [Embed], ephemeral: false})

        } else if ((group === "update_links" || group === "update_servers")  && subcommand === 'view') {
            const links = await executeQuery(`SELECT ${group === "update_links" ? "otherLinks" : "serverIDs"}, name FROM \`game-clans\` WHERE tag = ?;`, [tag])

            if (!links || links.otherLinks === '[]') {
                const Embed = new EmbedBuilder()
                    .setTitle(group === "update_links" ? "Clan links" : "Clan Servers")
                    .setColor(links.otherLinks === '[]' ? 16316405 : 12779520)
                    .setDescription(links.otherLinks === '[]' ? `[${tag}] Doesn't have any ${group === "update_links" ? "links" : "servers linked"}.` : `[${tag}] Doesn't exist.`)
                    .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }));

                return interaction.editReply({content:``, embeds: [Embed], ephemeral: true})
            }

            const items = JSON.parse(links.otherLinks);
            let linkRecap;
            if (group === "update_links") {
                items.map(item => `\n- [${item.title}](${item.link})`)
            } else {
                items.map(item => `\n- [${item.title}](https://www.battlemetrics.com/servers/postscriptum/${item.id})`)
            }

            const Embed = new EmbedBuilder()
                .setTitle(group === "update_links" ? "Clan links" : "Clan Servers")
                .setColor(16316405)
                .setDescription(`Links for ${links.name}:${linkRecap.join('')}`)
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }));

            return interaction.editReply({content:``, embeds: [Embed], ephemeral: true});
        } else if ((group === "update_links" || group === "update_servers")  && subcommand === 'add') {
            const newValue = interaction.options.getString('link') || interaction.options.getString('id');
            const linkTitle = interaction.options.getString('name');

            const links = await executeQuery(`SELECT ${group === "update_links" ? "otherLinks" : "serverIDs"} FROM \`game-clans\` WHERE tag = ?;`, [tag]);

            if (!links) {
                const Embed = new EmbedBuilder()
                    .setTitle(group === "update_links" ? "Clan links" : "Clan Servers")
                    .setColor(12779520)
                    .setDescription(`[${tag}] Doesn't exist.`)
                    .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }));

                return interaction.editReply({content:``, embeds: [Embed], ephemeral: true})
            }
            let parsedLinks = JSON.parse(links[group === "update_links" ? "otherLinks" : "serverIDs"])

            const linkExists = parsedLinks.some(element => {
                if (element.link === newValue || element.id === newValue) {
                    const Embed = new EmbedBuilder()
                        .setTitle(group === "update_links" ? "Link already exists" : "Server already exists")
                        .setColor(12779520)
                        .setDescription(`[${tag}] already has the ${group === "update_links" ? "link" : "server id"}:\n- ${element.title}\n- ${newValue}`)
                        .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }));
            
                    interaction.editReply({ content: '', embeds: [Embed], ephemeral: true });
                    return true;
                } else if (element.title === linkTitle) {
                    const Embed = new EmbedBuilder()
                        .setTitle(group === "update_links" ? "Link already exists" : "Server already exists")
                        .setColor(12779520)
                        .setDescription(`[${tag}] already has a ${group === "update_links" ? "link" : "server id"} with that title:\n- ${element.title}\n- ${group === "update_links" ? element.link : element.id}`)
                        .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }));
            
                    interaction.editReply({ content: '', embeds: [Embed], ephemeral: true });
                    return true;
                }
            });

            if (linkExists) return;

            if (group === "update_links") parsedLinks.push({title: linkTitle, link: checkLink(newValue)});
            if (group === "update_servers") parsedLinks.push({title: linkTitle, id: newValue});

            executeStatement(`UPDATE \`game-clans\` SET ${group === "update_links" ? "otherLinks" : "serverIDs"} = ? WHERE tag = ?;`, [JSON.stringify(parsedLinks), tag])
                .then(result => {
                    logger.info(`The ${group === "update_links" ? "link" : "server id"} (${linkTitle}) has been added to ${tag} by ${user}`, result);

                    const Embed = new EmbedBuilder()
                        .setTitle(group === "update_links" ? "Clan links Updated" : "Clan Servers Updated")
                        .setColor(result === 1 ? 16316405: 12779520)
                        .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }))
                        .setDescription( 
                            result === 1 ?
                            `[${linkTitle}](${group === "update_links" ? checkLink(newValue) : `https://www.battlemetrics.com/servers/postscriptum/${newValue}`}) has been added to [${tag}]\n-# Status code: \`${result}\`` :
                            `Unable to add the ${group === "update_links" ? "link" : "server id"}.`
                        );

                    return interaction.editReply({content:``, embeds: [Embed], ephemeral: true})
                }).catch(err => {
                    logger.error(`Unable to add ${linkTitle} to [${tag}] by ${user.username}`, err)

                    const Embed = new EmbedBuilder()
                        .setTitle("ERROR")
                        .setColor(12779520)
                        .setDescription(`Unable to execute the request.\nError message:\n\`\`\`md\n${err}\n\`\`\``);

                    return interaction.editReply({content:``, embeds: [Embed], ephemeral: false})
                });
        } else if ((group === "update_links" || group === "update_servers")  && subcommand === 'remove') {
            const valueToRemove = interaction.options.getString('link') || interaction.options.getString('id') || null;
            const valueTitleToRemove = interaction.options.getString('name') || null;

            const links = await executeQuery(`SELECT ${group === "update_links" ? "otherLinks" : "serverIDs"}, name FROM \`game-clans\` WHERE tag = ?;`, [tag])

            if (!links || links.otherLinks === '[]') {
                const Embed = new EmbedBuilder()
                    .setTitle(group === "update_links" ? "Clan links" : "Clan Servers")
                    .setColor(links.otherLinks === '[]' ? 16316405 : 12779520)
                    .setDescription(links.otherLinks === '[]' ? `[${tag}] Doesn't have any ${group === "update_links" ? "links" : "servers linked"}.` : `[${tag}] Doesn't exist.`)
                    .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }));

                return interaction.editReply({content:``, embeds: [Embed], ephemeral: true})
            }

            const items = JSON.parse(links.otherLinks);
            const indexTitle = group === "update_links" ? "link" : "id"
            let indexToRemove = null;
            items.forEach((element, index) => {
                if (element.title === valueTitleToRemove) indexToRemove = index;
                if (element[indexTitle].includes(valueToRemove)) indexToRemove = index;
            });

            if (typeof indexToRemove !== 'number') {
                const Embed = new EmbedBuilder()
                    .setTitle(group === "update_links" ? "Clan link not found" : "Clan Server not found")
                    .setColor(16316405)
                    .setDescription("Use the view command to display the current links and titles")
                    .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }));

                return interaction.editReply({content:``, embeds: [Embed], ephemeral: true});
            }

            const timeout = 1000 * 30; /* 1s * duration in seconds */
            const confirmEmbed = new EmbedBuilder()
                .setTitle("Confirmation Required")
                .setColor(16316405)
                .setDescription(`Are you sure you want to remove the ${group === "update_links" ? "link" : "server"} with the following details:\n\n**Value:** ${items[indexToRemove][indexTitle]}`)
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }))
                .setFooter({text: `This command will timeout in ${timeout/1000} seconds`});

            const confirmRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('temp_confirm_delete')
                        .setLabel('Yes')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('temp_cancel_delete')
                        .setLabel('No')
                        .setStyle(ButtonStyle.Secondary),
                );

            await interaction.editReply({ content: '', embeds: [confirmEmbed], components: [confirmRow], ephemeral: false });

            const filter = (i) => ['temp_confirm_delete', 'temp_cancel_delete'].includes(i.customId) && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: timeout });

            collector.on('collect', async (i) => {
                if (i.customId === 'temp_confirm_delete') {
                    const removedItem = items[indexToRemove];
                    items.splice(indexToRemove, 1);

                    executeStatement(`UPDATE \`game-clans\` SET ${group === "update_links" ? "otherLinks" : "serverIDs"} = ? WHERE tag = ?;`, [JSON.stringify(items), tag])
                    .then(result => {
                        logger.info(`The ${group === "update_links" ? "link" : "server id"} (${removedItem[indexTitle]}) has been removed to ${tag} by ${user}`, result);
    
                        const Embed = new EmbedBuilder()
                            .setTitle(group === "update_links" ? "Clan link Removed" : "Clan Server Removed")
                            .setColor(16316405)
                            .setDescription(`The link with the title \`${removedItem.title}\` and with the value of \`${removedItem[indexTitle]}\` was removed`)
                            .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }));
    
                        return i.update({content:``, embeds: [Embed], ephemeral: true})
                    }).catch(err => {
                        logger.error(`Unable to remove ${items[indexToRemove][indexTitle]} from [${tag}] by ${user.username}`, err)
    
                        const Embed = new EmbedBuilder()
                            .setTitle("ERROR")
                            .setColor(12779520)
                            .setDescription(`Unable to execute the request.\nError message:\n\`\`\`md\n${err}\n\`\`\``);
    
                        return i.update({content:``, embeds: [Embed], ephemeral: false})
                    });
                } else if (i.customId === 'temp_cancel_delete') {
                    const cancelEmbed = new EmbedBuilder()
                        .setTitle("Operation Cancelled")
                        .setColor(16316405)
                        .setDescription("The deletion process has been cancelled.")
                        .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }));

                    await i.update({ content: '', embeds: [cancelEmbed], components: [] });
                }
            });

            collector.on('end', (collected, reason) => {
                if (reason === 'time') {
                    const cancelEmbed = new EmbedBuilder()
                        .setTitle("Operation Cancelled")
                        .setColor(12779520)
                        .setDescription("The deletion process has been cancelled after timing out.")
                        .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }));

                        interaction.editReply({ embeds: [cancelEmbed], components: [] });
                }
            });

        } else if (group === "update" && subcommand === 'description') {

            const links = await executeQuery(`SELECT description FROM \`game-clans\` WHERE tag = ?;`, [tag]);

            if (!links) {
                const Embed = new EmbedBuilder()
                    .setTitle("Impossible, to execute")
                    .setColor(12779520)
                    .setDescription(`[${tag}] Doesn't exist.`)
                    .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }));

                return interaction.editReply({content:``, embeds: [Embed], ephemeral: true})
            }

            openDescriptionEditorModal(interaction, links.description);

            const filter = (i) => i.customId === 'temp_description_editor' && i.user.id === interaction.user.id;
            interaction.awaitModalSubmit({ filter, time: 180000 })
            .then(i => {
                const newDescription = i.fields.getTextInputValue('text_input');

                executeStatement('UPDATE `game-clans` SET description = ? WHERE tag = ?;', [newDescription, tag])
                    .then(status => {
                        logger.info('Updated description from', tag, 'by', user.username, user.id)

                        const Embed = new EmbedBuilder()
                            .setTitle('New Description Added')
                            .setDescription(`For the tag: \`${tag}\`\n\`\`\`\n${newDescription}\n\`\`\`\n-# Status code: \`${status}\``)
                            .setColor(16316405)
                            .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }));

                        i.reply({ content: '', embeds: [Embed], ephemeral: false });

                    }).catch(err => {
                        logger.error('Unable to update description for', tag, err)

                        i.reply({ content: `Unable to update description of ${tag}\n\`\`\`\n${err}\`\`\``, ephemeral: true });
                    })
            })
            .catch(logger.error);
        } else if (group === "update") {

            const name = interaction.options.getString('name');
            const invite = interaction.options.getString('invite');
            const image = interaction.options.getString('image');

            const clanData = await executeQuery(`SELECT id, ${subcommand} FROM \`game-clans\` WHERE tag = ?;`, [tag]);

            if (!clanData) {
                const Embed = new EmbedBuilder()
                    .setTitle("Impossible, to update")
                    .setColor(12779520)
                    .setDescription(`[${tag}] Doesn't exist.`)
                    .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }));

                return interaction.editReply({content:``, embeds: [Embed], ephemeral: true})
            }

            if (subcommand === 'image' && !checkImageUrl(image)) {
                const Embed = new EmbedBuilder()
                    .setTitle("Invalid Image")
                    .setColor(12779520)
                    .setDescription(`The provided link doesn't return an image.`)
                    .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }));

                return interaction.editReply({content:``, embeds: [Embed], ephemeral: true})
            } else if (!(name || invite || image)) {
                const Embed = new EmbedBuilder()
                    .setTitle("Unknown error")
                    .setColor(12779520)
                    .setDescription(`No value has been received...`)
                    .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }));

                return interaction.editReply({content:``, embeds: [Embed], ephemeral: true})
            }

            executeStatement(`UPDATE \`game-clans\` SET ${subcommand} = ? WHERE tag = ?;`, [name || invite || image, tag])
                .then(status => {
                    logger.info('Updated', subcommand, 'from', tag, 'by', user.username, user.id, 'with previous data being', clanData[subcommand], 'status code:', status)

                    const Embed = new EmbedBuilder()
                        .setTitle('Data updated')
                        .setColor(16316405);
                    
                    if (subcommand === 'image') {
                        Embed.setThumbnail(image);
                        Embed.setDescription('Image updated, if it doesn\'t show then the link is invalid')
                    } else {
                        Embed.setDescription(`The ${subcommand} has been changed from \`${clanData[subcommand]}\` to \`${name || invite}\` \n-# Status code: \`${status}\``);
                        Embed.setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }));
                    }
                    
                    console.log('Editing the interaction reply')
                    interaction.editReply({content:``, embeds: [Embed], ephemeral: true})
                })
                .catch(err => {

                });

        } else {
            return editReply({content:`Hmmm, not sure this probably isn't handled!`,ephemeral :true})
        }
    }
}