const fs = require('fs');
const assert = require('assert');

describe('Configuration and Token Checks', function() {

    let envContent;

    it('should check if config.json exists', function(done) {
        fs.access('./config.json', fs.constants.F_OK, (err) => {
            assert.strictEqual(err, null, 'config.json should exist');
            done();
        });
    });

    it('should check if .env file exists', function(done) {
        fs.access('./.env', fs.constants.F_OK, (err) => {
            assert.strictEqual(err, null, '.env should exist');

            if (!err) {
                envContent = fs.readFileSync('./.env', 'utf8');
            }

            done();
        });
    });

    it('should check if a token exists in .env file', function() {
        if (!envContent) {
            throw new Error('.env content was not loaded');
        }

        const tokenLine = envContent.split('\n').find(line => line.startsWith('TOKEN='));
        assert.ok(tokenLine, 'The token is not defined in the .env file.');

        const token = tokenLine.split('=')[1];
        assert.notStrictEqual(token, 'INSERT_YOUR_TOKEN_HERE', 'The token is set to the default placeholder value.');

        assert.ok(token.length >= 70, 'The token length is too short.');
        assert.ok(token.includes('.'), 'The token does not contain a period.');
        assert.strictEqual((token.match(/\./g) || []).length, 2, 'The token does not contain exactly two periods.');
    });

});
