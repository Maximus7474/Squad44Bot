const { EmbedBuilder, AttachmentBuilder, SlashCommandBuilder } = require('discord.js');

const { Allies, Axis } = require('../../data/factions.json');

const getFileName = (filepath) => {
    if (filepath && filepath.includes('/')) {
        return filepath.split('/').pop();
    }
    return filepath;
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
            .setDescription(factionData.description || null)
            .setColor(subcommand === 'axis' ? 14160916 : 3163276);

        if (typeof factionData.seal === 'string') {
            if (factionData.seal.includes('images/seals/')) {
                const attachmentFile = new AttachmentBuilder(`./${factionData.seal}`, {name: getFileName(factionData.seal), description: `The seal used by ${faction}`})

                factionEmbed.setThumbnail(`attachment://${getFileName(factionData.seal)}`)
                attachments.push(attachmentFile)
            } else {
                factionEmbed.setThumbnail(factionData.seal)
            }
        } else {
            factionEmbed.setThumbnail(client.user.displayAvatarURL({ dynamic: true, form: 'png', size: 128}));
        }

        if (typeof factionData.uniform === 'string') {
            if (factionData.uniform.includes('images/uniforms/')) {
                const attachmentFile = new AttachmentBuilder(`./${factionData.uniform}`, {name: getFileName(factionData.uniform), description: `The uniforms used by ${faction}`});
                
                factionEmbed.setImage(`attachment://${attachmentFile.name}`)
                attachments.push(attachmentFile)
            } else {
                factionEmbed.setImage(factionData.uniform)
            }
        }

        return interaction.reply({
            content: ``,
            ephemeral: false,
            embeds: [factionEmbed],
            files: attachments
        });
    }
}