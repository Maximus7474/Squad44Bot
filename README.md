# Squad 44 Bot

![Discord](https://img.shields.io/discord/1267893589707587718?style=flat&logo=discord&logoColor=%237289da&label=Discord%20Guild&color=%23287e29)
![](https://img.shields.io/github/v/release/Maximus7474/Squad44Bot?logo=github)

# Project no longer maintained
- Due to no activity or use of this program maintanenace of it has been depreceated.

## Contributing
- The `vehicleInfo.json` is work in progress, data __will__ be inacurate/missing, PRs are welcome to amend the data as well as Issues for improving data display/storage.

> If you're willing to contribute to the project please read the [contribution guide](https://github.com/Maximus7474/Squad44Bot/blob/main/CONTRIBUTING.md).

## Setup
1. Rename `.env.example` to `.env` and add in the following details:
```bash
TOKEN=INSERT_YOUR_TOKEN_HERE
```
2. Rename `config.template.json` to `config.json`
3. Setup the roles and channels in `config.json`, remember set each id as a string not a number.
  - You need to setup language and guild id manually if not it won't work.
  - It is also possible to setup the roles and channels through slash commands as long as you're the administrator on the server.
4. Run `pnpm install` to install the dependancies
5. Run `pnpm run start` to start the bot


## Security Tip
The `.env` file is set to be ignored, the reason being that your discord Bots token is in it and should be kept private.
Even if Discord has a system in place to change/suspend your token if found on the web don't rely on it, keep it private.
So don't alter the `.gitignore` as piece of advice for people not knowing how git works.

## Credits
Thanks to [FissionFeline](https://github.com/FissionFeline) for the template used to get the bot started.
You can find it [here](https://github.com/FissionFeline/discord-js-template) to use it yourself and start or continue learning __discord.js__
