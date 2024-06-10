const fs = require('fs');
const path = require('path');
const log = new require('../logger.js');
const logger = new log("Command loader");
const { SlashCommandBuilder } = require('@discordjs/builders');
const path_to_commands = path.join(__dirname, '/../../commands/');

function getAllJsFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach((file) => {
        if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
            arrayOfFiles = getAllJsFiles(path.join(dirPath, file), arrayOfFiles);
        } else if (file.endsWith('.js')) {
            arrayOfFiles.push(path.join(dirPath, file));
        }
    });

    return arrayOfFiles;
}

module.exports = (client) => {
    const commandFiles = getAllJsFiles(path_to_commands);

    let stack = [];
    client.commands = {};

    for (const filePath of commandFiles) {
        const command_loaded = require(filePath);
        const commandName = path.basename(filePath);

        if (!command_loaded) {
            logger.error(`${commandName} not valid`);
            continue;
        }
        if (typeof command_loaded.execute === 'undefined' || typeof command_loaded.execute !== 'function') {
            logger.error(`${commandName} does not have the execute function`);
            continue;
        }
        if (!(command_loaded.register_command instanceof SlashCommandBuilder)) {
            logger.error(`${commandName} does not have the register_command SlashCommandBuilder instance`);
            continue;
        }

        if (Object.keys(client.commands).includes(command_loaded.register_command.name)) {
            logger.warning(`Two or more commands share the name ${command_loaded.register_command.name}`);
            continue;
        }

        client.commands[command_loaded.register_command.name] = command_loaded;
        stack.push(command_loaded.register_command);

        logger.success(`Successfully loaded ${commandName}`);
    }

    logger.info("Commands loaded");
    return stack;
};
