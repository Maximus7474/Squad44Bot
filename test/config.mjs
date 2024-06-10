import * as fs from 'fs';
import * as chai from 'chai';

const { expect } = chai;

describe('Configuration Test', () => {

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
    
    it('should check if a token exists', () => {
        const configFile = './.env';
        const fileExists = fs.existsSync(configFile);
        
        if (!fileExists) {
            throw new Error('The .env file does not exist.');
        }
    
        const envContent = fs.readFileSync(configFile, 'utf8');
        const tokenValue = envContent.split('\n').find(line => line.startsWith('TOKEN='));
        const token = tokenValue.split('=')[1];
        
        if (!tokenValue || token === 'INSERT_YOUR_TOKEN_HERE') {
            throw new Error('The token is not defined in the .env file.');
        }
        
        if (token.length < 70 || !token.includes('.') || (token.match(/\./g) || []).length !== 2) {
            throw new Error('The token is not valid.');
        }
    });

});
