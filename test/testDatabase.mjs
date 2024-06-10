import { exec } from 'child_process';
import * as sqlite3 from 'sqlite3';
import * as fs from 'fs';
import * as chai from 'chai';

const { expect } = chai;

describe('SQLite and Database Checks', function() {

    it('should be able to import sqlite3', async function() {
        let sqlite3;
        try {
            sqlite3 = await import('sqlite3');
        } catch (error) {
            throw new Error('Failed to import sqlite3: ' + error.message);
        }
        expect(sqlite3).to.not.be.undefined;
    });


    it('should check if ./data.db exists', function(done) {
        fs.access('./data.db', fs.constants.F_OK, (err) => {
            expect(err).to.be.null;
            done();
        });
    });

});
