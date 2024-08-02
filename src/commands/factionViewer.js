const { EmbedBuilder, AttachmentBuilder, SlashCommandBuilder } = require('discord.js');
const path = require('path');

const { Allies, Axis } = require('../../data/factions.json');

const GetFilePath = (location) => {
    return path.join(__dirname, `../../${location}`)
}

module.exports = {
    register_command: new SlashCommandBuilder()
        .setName('faction')
        .setDescription('Displays information on a specific faction')
        .addSubcommand( subcommand =>
            subcommand
            .setName("axis")
            .setDescription("Search for a faction part of the axis forces")
            .addStringOption(option => 
                option.setName('faction')
                .setDescription("Faction Name")
                .setRequired(true)
                .addChoices(
                    ...Object.keys(Axis).map(faction => ({
                        name: faction,
                        value: faction
                    }))
                )
            )
        )
        .addSubcommand( subcommand =>
            subcommand
            .setName("allies")
            .setDescription("Search for a faction part of the allied forces")
            .addStringOption(option => 
                option.setName('faction')
                .setDescription("Faction Name")
                .setRequired(true)
                .addChoices(
                    ...Object.keys(Allies).map(faction => ({
                        name: faction,
                        value: faction
                    }))
                )
            )
        ),
    async execute(client, interaction) {
        const subcommand = interaction.options._subcommand;
        const faction = interaction.options.getString('faction');

        let factionData;
        if (subcommand === 'axis') factionData = Axis[faction];
        if (subcommand === 'allies') factionData = Allies[faction];

        if (!faction) return interaction.reply({
            content: `No faction data is available for ${faction} at the moment.`,
            ephemeral: true
        })

        let attachments = [];

        const factionEmbed = new EmbedBuilder()
            .setTitle(faction)
            .setDescription(factionData.Description || null)
            .setColor(subcommand === 'axis' ? 14160916 : 3163276);

        if (typeof factionData.Seal === 'string') {
            if (factionData.Seal.includes('images/seals/')) {
                const imgPath = GetFilePath(factionData.Seal);
                const attachmentFile = new AttachmentBuilder(imgPath)
                
                factionEmbed.setThumbnail(`attachment://${attachmentFile.name}`)
                attachments.push(attachmentFile)
            } else {
                factionEmbed.setThumbnail(factionData.Seal)
            }
        } else {
            factionEmbed.setThumbnail(client.user.displayAvatarURL({ dynamic: true, form: 'png', size: 128}));
        }

        if (typeof factionData.Uniforms === 'string') {
            if (factionData.Uniforms.includes('images/uniforms/')) {
                const imgPath = GetFilePath(factionData.Uniforms);
                const attachmentFile = new AttachmentBuilder(imgPath)
                
                factionEmbed.setThumbnail(`attachment://${attachmentFile.name}`)
                attachments.push(attachmentFile)
            } else {
                factionEmbed.setThumbnail(factionData.Uniforms)
            }
        }

        return interaction.reply({
            content: ``,
            ephemeral: false,
            embeds: [factionEmbed],
            attachments: attachments
        });
    }
}