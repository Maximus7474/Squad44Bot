const colors = require('colors/safe');
const { EmbedBuilder } = require('discord.js');
const { channels } = require('../../config.json')

class Logger {
    constructor(origin) {
        this.origin = origin
    }
    info(...message) {
        console.log(`${colors.gray((new Date()).toLocaleString())} ${(colors.cyan(`[INFO]`)+`    [${colors.blue(this.origin)}]`).padEnd(50, ' ')}`, ...message);
    }

    success(...message) {
        console.log(`${colors.gray((new Date()).toLocaleString())} ${(colors.green(`[SUCCESS]`)+` [${colors.blue(this.origin)}]`).padEnd(50, ' ')}`, ...message);
    }

    warn(...message) {
        console.warn(`${colors.gray((new Date()).toLocaleString())} ${(colors.yellow(`[WARN]`)+`    [${colors.blue(this.origin)}]`).padEnd(50, ' ')}`, ...message);
    }

    error(...message) {
        console.error(`${colors.gray((new Date()).toLocaleString())} ${(colors.red(`[ERROR]`)+`   [${colors.blue(this.origin)}]`).padEnd(50, ' ')}`, ...message);
    }

    errorlog(interaction, message, err) {
        const channel = interaction.client.channels.cache.get(channels.errors);

        const Embed = new EmbedBuilder()
            .setTitle('An Error occured')
            .setAuthor({name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 })})
            .setColor(12779520)
            .setDescription(`Error Section: \`${origin}\`\nMessage: \`${message}\n\`\`\`\`md\n${err}\n\`\`\``);

        channel.send({
            embeds: [Embed]
        })
    }

    infolog(interaction, message) {
        const channel = interaction.client.channels.cache.get(channels.errors);

        const Embed = new EmbedBuilder()
            .setTitle('Action log')
            .setAuthor({name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 })})
            .setColor(14840832)
            .setDescription(message);

        channel.send({
            embeds: [Embed]
        })
    }
}

module.exports = Logger;