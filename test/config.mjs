import * as fs from 'fs';
import * as chai from 'chai';

const { expect } = chai;

describe('Config Files Test', () => {

    it('should check if config.json exists', () => {
        
        const configFile = './config.json';
        const fileExists = fs.existsSync(configFile);

        expect(fileExists).to.be.true;
    });
    
    it('should check if en.json exists', () => {
        
        const configFile = './src/locales/en.json';
        const fileExists = fs.existsSync(configFile);

        expect(fileExists).to.be.true;
    });

});
