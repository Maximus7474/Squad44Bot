const { SlashCommandBuilder } = require('@discordjs/builders');

const VehicleData = require('../../data/vehicleInfo.json');
const { EmbedBuilder } = require('discord.js');

const thumbnailImage = (team) => {
    if (team === "Allies") return "https://r2.fivemanage.com/pub/ngxgy4wfhtv7.png";
    if (team === "Axis") return "https://r2.fivemanage.com/pub/tkhmklv1sq92.png";
    return 'https://assets-prd.ignimgs.com/2023/12/15/squad44-1702600459401.jpg'
}

const tankDisplayEmbed = (name, tankData) => {
    const Embed = new EmbedBuilder()
        .setTitle(name)
        .setThumbnail(thumbnailImage(tankData.team))
        .setColor(16316405)
        .setDescription(
            `Side: **${tankData.team}**\nTank Type: \`${tankData.type}\`\nAvailable in Chapters: ${tankData.chapters.join(', ')}\nFactions: ${tankData.factions.join(', ')}`
        ).setFields(
            { name: 'Crewing:', value: `- Rôles:\n> ${(tankData.details.crew ?? ['?']).sort().join(', ')}\n- Passagers: \`${tankData.details.passengers ?? '0'}\``, inline: false },
            { name: 'Weaponry:', value: `- Main Canon: ${tankData.details.caliber ?? '?'}\n- Main Canon Ammunition:\n> ${Object.keys(tankData.details.shells ?? {'?': '?'}).sort().join(', ')}`, inline: false },
        )
        .setImage(typeof tankData.image === 'string' ? tankData.image : null);
    return Embed
}

const canonDisplayEmbed = (name, canonData) => {
    const Embed = new EmbedBuilder()
        .setTitle(name)
        .setThumbnail(thumbnailImage(canonData.team))
        .setColor(16316405)
        .setDescription(
            `Side: **${canonData.team}**Canon Type: \`${canonData.type}\`\nAvailable in Chapters: ${canonData.chapters.join(', ')}\nFactions: ${canonData.factions.join(', ')}`
        ).setFields(
            { name: 'Weaponry:', value: Object.keys(canonData.weaponry).map((weapon) => `- ${weapon}`).join("\n")}
        )
        .setImage(typeof canonData.image === 'string' ? canonData.image : null);
    return Embed
}

const vehicleDisplayEmbed = (name, vehicleData) => {
    const Embed = new EmbedBuilder()
        .setTitle(name)
        .setThumbnail(thumbnailImage(vehicleData.team))
        .setColor(16316405)
        .setDescription(
            `Side: **${vehicleData.team}**\n` +
            `Class: **\`${vehicleData.class}**\`\n` +
            (vehicleData.class !== undefined ? `Type: ${vehicleData.type}` : '') + '\n' +
            `Available in Chapters: **\`${vehicleData.chapters.join('`, `')}\`**\n` +
            `Factions: \n> ${vehicleData.factions.join(', ')}\n` +
            `Seats: ${vehicleData.seats}`
        )
        .setImage(typeof vehicleData.image === 'string' ? vehicleData.image : null);

    if (vehicleData.weaponry && Object.keys(vehicleData.weaponry).length > 0) {
        Embed.addFields(
            { name: 'Weaponry:', value: Object.entries(vehicleData.weaponry).map(([weapon, amount]) => `- ${weapon}${typeof amount === 'number' && amount > 1 ? `: ${amount}` : ''}`).join("\n") }
        );
    }

    return Embed;
};

const functionDistribution = {
    tanks: tankDisplayEmbed,
    canons: canonDisplayEmbed,
    vehicles: vehicleDisplayEmbed
}

module.exports = {
    register_command: new SlashCommandBuilder()
        .setName('vehicle-search')
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
        )
        .addSubcommand(command =>
            command.setName('vehicles')
                .setDescription('Search for a vehicle')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Vehicle name')
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
			filtered.length > 25 ? [{name: "Too Many Options", value: "Too Many Options"}] : filtered.map(choice => ({ name: choice, value: choice })),
		);
    },
    async execute(client, interaction) {
        const subcommand = interaction.options._subcommand;

        const name = interaction.options.getString('name');

        const searchedVehicleData = VehicleData[subcommand][name];

        if (searchedVehicleData === undefined) {
            const embed = new EmbedBuilder()
                .setTitle('Invalid search parameter')
                .setDescription(`\`${name}\` isn't a valid name parameter for searching ${subcommand}.`)
                .setColor(16711680)
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 256 }));

            return interaction.reply({
                embeds: [embed],
                ephemeral :true
            })
        }

        return interaction.reply({embeds: [functionDistribution[subcommand](name, searchedVehicleData)], ephemeral: false});
    }
}