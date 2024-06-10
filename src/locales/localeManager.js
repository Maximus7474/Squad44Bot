const log = new require('../utils/logger.js');
const logger = new log("Translate");

const configManager = require('../utils/configManager.js');

const language = configManager.getConfig().language

try {
    translations = require(`./${language}.json`);
} catch (err) {
    if (language !== undefined) logger.error(`Setup language: '${language}' doensn't exist in the locales folder. Create the translation in './src/locales/'`);
    logger.info('Defaulting to English language')

    translations = require(`./en.json`);
}

module.exports = translations;