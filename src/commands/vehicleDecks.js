const { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder, ButtonBuilder } = require('@discordjs/builders');
const tankDecks = require('../../data/vehicleDecks.json')

const keys = {
    All: ["Heavy", "Medium", "Recon", "Mechanized", "Specialized"],
    Tanks: ["Heavy", "Medium", "Recon"],
    Vehicles: ["Mechanized", "Specialized"]
}

const DoesLayerHaveDeck = (categories, deck) => {
    categories.forEach((element, i) => {
        if (deck[element] !== undefined || deck[element] !== null) return true;
    })
    return false;
}

module.exports = {
    register_command: new SlashCommandBuilder()
        .setName('decks')
        .setDescription('Displays information about the various vehicle decks')
        .addStringOption(option =>
            option.setName('map')
                .setDescription('Map concerned to view the decks')
                .setRequired(true)
                .addChoices(
                    ...Object.keys(tankDecks).map(map => ({
                        name: map,
                        value: map
                    }))
                )
        )
        .addStringOption(option =>
            option.setName('faction')
                .setDescription('Faction of which to view the deck')
                .setRequired(true)
                .addChoices(
                    {name: 'Axis', value: 'Axis'},
                    {name: 'Allies', value: 'Allies'},
                )
        )
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Faction of which to view the deck')
                .setRequired(false)
                .addChoices(
                    {name: 'Tanks', value: 'Tanks'},
                    {name: 'Vehicles', value: 'Vehicles'},
                    {name: 'All', value: 'All'},
                )
        ),
async execute(client, interaction) {
    const selectedMap = interaction.options.getString('map');
    const selectedFaction = interaction.options.getString('faction');
    const selectedCategory = keys[interaction.options.getString('type') || 'Tanks'];
    const mapData = tankDecks[selectedMap];

    const layerSelectDropDown = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('temp_tankdeck_layerselect')
                .setPlaceholder('Select a layer')
                .setOptions(
                    Object.keys(mapData).map(key => ({
                        label: key,
                        value: key
                    }))
                ),
        )
    
    const Embed = new EmbedBuilder()
        .setTitle(`Tank Decks for ${selectedMap}`)
        .setColor(16316405)
        .setDescription('Select the wanted layer from the following list');
    
    await interaction.reply({content: '', embeds: [Embed], components: [layerSelectDropDown], ephemeral: false})

    const filter = i => (i.customId === 'temp_tankdeck_layerselect' || i.customId === 'temp_tankdeck_axis' || i.customId === 'temp_tankdeck_allies') && i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async i => {
        if (i.customId === 'temp_tankdeck_layerselect') {
            const selectedKey = i.values[0];
            const deckInfo = mapData[selectedKey][selectedFaction];

            const Embed = new EmbedBuilder()
                .setTitle(`(${selectedFaction}) ${selectedMap} - ${selectedKey}`)
                .setColor(16316405);
                        
            if (!DoesLayerHaveDeck(selectedCategory, deckInfo)) {
                Embed.setDescription(`The faction ${deckInfo.Faction} doesn't have ${selectedCategory === 'Tanks' ? 'a Tank deck' : selectedCategory === 'Vehicles' ? 'a Specialized/Mechanized deck' : 'any special vehicles'} on this layer`);
            } else {
                Embed.setDescription(`Here's the tank deck for ${deckInfo.Faction} on the selected layer:`);
                
                selectedCategory.forEach((key) => {
                    console.log(key, deckInfo[key])
                    if (deckInfo[key] !== null, deckInfo[key] !== undefined) {
                        let fieldValue = '';
                        Object.keys(deckInfo[key]).forEach(nextKey => {
                            fieldValue += `- ${nextKey}: \`${deckInfo[key][nextKey]}\`\n`;
                        });
                        Embed.addFields({ name: key, value: fieldValue || 'No details available', inline: false });
                    }
                });
            }

            await i.update({
                content: ``,
                embeds: [Embed],
                components: [],
                ephemeral: false
            });

            collector.stop();
        }
    });

    collector.on('end', collected => {
        if (collected.size === 0) {
            interaction.editReply({
                content: 'You did not select any option.',
                embeds: [],
                components: [],
                ephemeral: true
            });
        }
    });

}
}