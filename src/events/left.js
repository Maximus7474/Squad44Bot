const { Events, EmbedBuilder } = require('discord.js');

const configManager = require('../utils/configManager.js');

module.exports = {
    event: Events.GuildMemberAdd,
    type: "on",
    async call(client, member) {
        
        const { channels, main_guild } = configManager.getConfig();

        if (!main_guild === member.guild.id) return;

        if (channels.joins.id === null) return;

        const channel = client.channels.cache.get(channels.joins.id);
        if (channel) {
            const leaveEmbed = new EmbedBuilder()
                .setTitle('User Left')
                .setColor('Orange')
                .setDescription(`- Username: ${member.user.tag}\n- ID: ${member.user.id}\n- Joined at: <t:${Math.round(member.user.joinedTimestamp/1000)}:d>`);
            
            try {
                leaveEmbed.setThumbnail(member.user.displayAvatarURL({ dynamic: true, format: 'png', size: 256 }));
            } catch {
                leaveEmbed.setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 256 }));
            }
            
            channel.send({
                embeds: [leaveEmbed]
            });
        }
    }
}