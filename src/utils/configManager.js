const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../../config.json'); // Ensure the correct path to config.json

const log = new require('./logger.js')
const logger = new log("ConfigManager")

class ConfigManager {
    constructor() {
        this.loadConfig();
        logger.info("Config Manager loaded")
    }

    loadConfig() {
        const rawData = fs.readFileSync(configPath);
        this.config = JSON.parse(rawData);
    }

    getConfig() {
        return this.config;
    }

    updateConfig(newConfig) {
        this.config = newConfig;
        fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
        logger.info("Config file updated");
    }

    reloadConfig() {
        this.loadConfig();
    }
}

const configManagerInstance = new ConfigManager();

module.exports = configManagerInstance;
