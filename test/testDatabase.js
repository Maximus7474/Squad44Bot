const fs = require('fs');
const assert = require('assert');

describe('SQLite and Database Checks', function() {

    let sqlite3;

    it('should be able to import sqlite3', async function() {
        try {
            sqlite3 = await import('sqlite3');
        } catch (error) {
            throw new Error('Failed to import sqlite3: ' + error.message);
        }
        assert.notStrictEqual(sqlite3, undefined, 'sqlite3 should not be undefined');
    });

    it('should check if ./data.db exists', function(done) {
        fs.access('./data.db', fs.constants.F_OK, (err) => {
            assert.strictEqual(err, null, './data.db should exist');
            done();
        });
    });
});
