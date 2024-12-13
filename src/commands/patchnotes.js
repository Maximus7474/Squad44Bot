const { ButtonStyle, SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require('discord.js');
const https = require('https');
const assert = require('assert');

const log = new require('../utils/logger.js');
const logger = new log("Patchnotes");
const configManager = require('../utils/configManager');
const { repository } = configManager.getConfig();

assert((repository !== undefined && repository !== null && repository.includes('github.com/')), "The github Repository has not been defined in the 'config.json'")

function getLatestReleasePatchNotes(callback) {
    const owner = repository.split('github.com/')[1].split('/')[0];
    const repo = repository.split('/')[repository.split('/').length - 1];

    const options = {
        hostname: 'api.github.com',
        path: `/repos/${owner}/${repo}/releases/latest`,
        method: 'GET',
        headers: {
            'User-Agent': 'Node.js',
            'Accept': 'application/vnd.github.v3+json'
        }
    };

    const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const release = JSON.parse(data);
                if (release && release.body && release.tag_name) {
                    callback(null, {
                        patchNotes: release.body,
                        versionTag: release.tag_name
                    });
                } else {
                    callback(new Error('Failed to get patch notes or version tag'));
                }
            } catch (error) {
                callback(error);
            }
        });
    });

    req.on('error', (e) => {
        callback(e);
    });

    req.end();
}

function refactorPatchnoteText(patchnote, version) {

    patchnote = `${patchnote}\n\n${patchnote}\n\n${patchnote}`;

    const formattedPatchnote = patchnote
        .replace(/\n\n##/g, '\n##')
        .replace(/- \*\*(.+?)\*\*: (.+?) \(\[([\w\d]+?)\]\((https:\/\/github.com\/.+?)\)\)/g, (match, scope, description, commit, url) => {
            return `- **${scope}**: ${description} ([${commit}](${url}))`;
        })
        .replace(/- (.+?) \(\[([\w\d]+?)\]\((https:\/\/github.com\/.+?)\)\)/g, (match, description, commit, url) => {
            return `- ${description} ([${commit}](${url}))`;
        });

    const link = `...\n\n> View [Full Changelog](https://github.com/Maximus7474/Squad44Bot/releases/tag/${version})`;

    if (formattedPatchnote.length <= 2048) return formattedPatchnote;

    const truncatedPatchnote = formattedPatchnote.slice(0, 2048 - (link.length + 1));
    return truncatedPatchnote.slice(0, truncatedPatchnote.lastIndexOf('##')) + link;
}

module.exports = {
    register_command: new SlashCommandBuilder()
        .setName('patchnote')
        .setDescription('Fetches the latest release notes from the GitHub repository.'),

    async execute(client, interaction) {

        getLatestReleasePatchNotes((err, patchNotes) => {
            if (err) {
                logger.error('Unable to fetch patchnotes from github repo', err)
                return interaction.reply({
                    content: `Failed to fetch the latest release information. Please try again later.\nError Message:\n\`\`\`${err}\`\`\``,
                    ephemeral: true
                });
            } else {

                const patchnoteEmbed = new EmbedBuilder()
                    .setTitle(`Latest Patchnote ${patchNotes.versionTag}`)
                    .setURL('https://github.com/Maximus7474/Squad44Bot')
                    .setAuthor({
                        iconURL: 'https://avatars.githubusercontent.com/u/94017712',
                        name: 'Maximus Prime'
                    })
                    .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 256 }))
                    .setColor(16316405)
                    .setDescription(refactorPatchnoteText(patchNotes.patchNotes, patchNotes.versionTag))
                    .setFooter({text: "Built by Maximus, for the Squad 44 (a.k.a PS) community."});
                
                const supportButton = new ButtonBuilder()
                    .setLabel('Support Project')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://ko-fi.com/maximus_prime');
            
                const issuesButton = new ButtonBuilder()
                    .setLabel('Report Issues')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://github.com/Maximus7474/Squad44Bot/issues');
                
                const contributeButton = new ButtonBuilder()
                    .setLabel('Contribute to Project')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://github.com/Maximus7474/Squad44Bot');
                
                const row = new ActionRowBuilder()
                    .addComponents(issuesButton, supportButton, contributeButton);
                
                return interaction.reply({
                    content: ``,
                    embeds: [patchnoteEmbed],
                    components: [row],
                    ephemeral: false
                });
            }
        });
    }
}
