const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    register_command: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Want to invite the bot to your server ?'),
    async execute(client, interaction) {
        const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${client.application.id}&permissions=18496&integration_type=0&scope=bot+applications.commands`;
        const discordInvite = 'https://discord.gg/MFhkJhxpHG';

        const embed = new EmbedBuilder()
            .setTitle('Invite me!')
            .setColor(16316405)
            .setDescription(`You can invite me to your server using [this link](${inviteUrl}).\nYou can also join the [discord server](${discordInvite})`)
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }))

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
}