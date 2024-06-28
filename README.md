# Squad 44 Bot

![](https://img.shields.io/github/downloads/Maximus7474/Squad44Bot/total?logo=github)

This Bot is a simple test to try integrations out including web queries and sorting data.

Thanks to [FissionFeline](https://github.com/FissionFeline) for the template used to get the bot started.
You can find it [here](https://github.com/FissionFeline/discord-js-template) to use it yourself and start or continue learning __discord.js__

## Setup
1. Rename `.env.example` to `.env` and add in the following details:
```bash
TOKEN=INSERT_YOUR_TOKEN_HERE
```
2. Rename `config.template.json` to `config.json`
3. Setup the roles and channels in `config.json`, remember set each id as a string not a number.
  - You need to setup language and guild id manually if not it won't work.
  - It is also possible to setup the roles and channels through slash commands as long as you're the administrator on the server.
4. Run `npm install` to install the dependancies
5. Run `npm run start` to start the bot


## Security Tip
The `.env` file is set to be ignored, the reason being that your discord Bots token is in it and should be kept private.
Even if Discord has a system in place to change/suspend your token if found on the web don't rely on it, keep it private.
So don't alter the `.gitignore` as piece of advice for people not knowing how git works.
