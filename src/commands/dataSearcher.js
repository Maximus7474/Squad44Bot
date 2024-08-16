const { SlashCommandBuilder } = require('@discordjs/builders');

const VehicleData = require('../../data/vehicleInfo.json');
const { EmbedBuilder } = require('discord.js');

const tankDisplayEmbed = (name, tankData) => {
    const Embed = new EmbedBuilder()
        .setTitle(name)
        .setColor(16316405)
        .setDescription(
            `Tank Type: \`${tankData.type}\`\nAvailable in Chapters: ${tankData.chapters.join(', ')}\nFactions: ${tankData.factions.join(', ')}`
        ).setFields(
            { name: 'Crewing:', value: `- Rôles:\n> ${(tankData.details.crew ?? ['?']).sort().join(', ')}\n- Passagers: \`${tankData.details.passengers ?? '0'}\``, inline: false },
            { name: 'Weaponry:', value: `- Main Canon: ${tankData.details.caliber ?? '?'}\n- Main Canon Ammunition:\n> ${Object.keys(tankData.details.shells ?? {'?': '?'}).sort().join(', ')}`, inline: false },
        );
    return Embed
}

const canonDisplayEmbed = (name, tankData) => {
    const Embed = new EmbedBuilder()
        .setTitle(name)
        .setColor(16316405)
        .setDescription(
            `Canon Type: \`${tankData.type}\`\nAvailable in Chapters: ${tankData.chapters.join(', ')}\nFactions: ${tankData.factions.join(', ')}`
        ).setFields(
            { name: 'Weaponry:', value: Object.entries(tankData.weaponry).map(([weapon, amount]) => `- ${weapon}`).join("\n")}
        );
    return Embed
}

const functionDistribution = {
    tanks: tankDisplayEmbed,
    canons: canonDisplayEmbed
}

module.exports = {
    register_command: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search for information on different aspects of the game!')
        .addSubcommand(command =>
            command.setName('tanks')
                .setDescription('Search for a tank')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Vehicle name')
                        .setAutocomplete(true)
                        .setRequired(true)
                )
        )
        .addSubcommand(command =>
            command.setName('canons')
                .setDescription('Search for a emplaced canon')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Canon name')
                        .setAutocomplete(true)
                        .setRequired(true)
                )
        ),
    async auto_complete (client, interaction) {
        const subcommand = interaction.options._subcommand;

        const focusedValue = interaction.options.getFocused();
        const searchValues = Object.keys(VehicleData[subcommand]);
        const filtered = searchValues.filter(choice => choice.toLocaleLowerCase().includes(focusedValue.toLocaleLowerCase()));

		await interaction.respond(
			filtered.length > 25 ? [{name: "Too Many Options", value: "N/A"}] : filtered.map(choice => ({ name: choice, value: choice })),
		);
    },
    async execute(client, interaction) {
        const subcommand = interaction.options._subcommand;

        const name = interaction.options.getString('name');

        const searchedVehicleData = VehicleData[subcommand][name];

        return interaction.reply({embeds: [functionDistribution[subcommand](name, searchedVehicleData)], ephemeral :true})
    }
}