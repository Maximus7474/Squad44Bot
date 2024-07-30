const { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder, ButtonBuilder } = require('@discordjs/builders');
const tankDecks = require('../../data/tankDecks.json')

const getEmojiByName = (list, name) => list.fetch(emoji => emoji.name === name) || null;

module.exports = {
    register_command: new SlashCommandBuilder()
        .setName('decks')
        .setDescription('Displays information about the various tank decks !')
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
        ),
async execute(client, interaction) {
    const selectedMap = interaction.options.getString('map');
    const selectedFaction = interaction.options.getString('faction');
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
            
            if (deckInfo.Heavy === null && deckInfo.Medium === null && deckInfo.Recon === null) {
                Embed.setDescription(`The faction ${deckInfo.faction} doesn't have a tank deck on this layer`);
            } else {
                Embed.setDescription(`Here's the tank deck for ${deckInfo.Faction} on the selected layer:`);
                
                Object.keys(deckInfo).forEach(key => {
                    if (deckInfo[key] !== null && key !== 'Faction') {
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