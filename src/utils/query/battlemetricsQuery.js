const log = new require('../logger.js')
const logger = new log("BattleMetrics API")

async function queryBattleMetrics(endpoint, accessToken) {
    const url = `https://api.battlemetrics.com/${endpoint}`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: accessToken !== undefined ? {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            } : {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        logger.error('Error querying BattleMetrics API:', error);
        return null;
    }
}

// Export the function as a module
module.exports = {
    queryBattleMetrics
};
