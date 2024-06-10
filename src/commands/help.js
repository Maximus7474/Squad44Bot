const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    register_command: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays all commands available to you !'),
    async execute(client, interaction) {
        return interaction.reply({content:`Haven't build this thing yet!`,ephemeral :true})
    }
}