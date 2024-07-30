const { Events, EmbedBuilder } = require('discord.js');

const configManager = require('../utils/configManager.js');

module.exports = {
    event: Events.GuildMemberAdd,
    type: "on",
    async call(client, member, ...args) {
        
        const { channels, main_guild } = configManager.getConfig();

        if (!main_guild === member.guild.id) return;

        if (channels.joins.id === null) return;

        const channel = client.channels.cache.get(channels.joins.id);
        if (channel) {
            const joinEmbed = new EmbedBuilder()
                .setTitle('New Join')
                .setColor('Green')
                .setDescription(`- Username: ${member.user.tag}\n- ID: ${member.user.id}\n- Created at: <t:${Math.round(member.user.createdTimestamp/1000)}:d>`);
            
            try {
                joinEmbed.setThumbnail(member.user.displayAvatarURL({ dynamic: true, format: 'png', size: 256 }));
            } catch (error) {
                joinEmbed.setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 256 }));
            }

            channel.send({
                embeds: [joinEmbed]
            });
        }
    }
}