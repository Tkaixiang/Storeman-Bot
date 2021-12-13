import { Client, Intents } from 'discord.js'
import { insertCommands } from './deploy-commands'
import { open, getCollections } from './mongoDB'
import sphelp from './Commands/sphelp'
import spsetamount from './Commands/spsetamount'
import spstatus from './Commands/spstatus'
import spsettarget from './Commands/spsettarget'
import spremovetarget from './Commands/spremovetarget'
import spsetpassword from './Commands/spsetpassword'
import spsetlogichannel from './Commands/spsetlogichannel'
import spremovelogichannel from './Commands/spremovelogichannel'
import NodeCache from 'node-cache'
require('dotenv').config()

declare global {
    var NodeCacheObj: NodeCache;
}

const firstTimeSetup = async (): Promise<void> => {
    // Run first-time setup
    const collections = getCollections()
    insertCommands()
    await collections.config.insertOne({ firstSetup: true })
    console.info("First time setup completed.")
}
const main = async (): Promise<void> => {
    // Create a new client instance 
    const client = new Client({ intents: [Intents.FLAGS.GUILDS] })
    global.NodeCacheObj = new NodeCache();

    // Connect to mongoDB
    if (await open()) {
        const collections = getCollections()

        /*const configOptions = await collections.config.findOne({}, {})
        if (configOptions) {
            if (!configOptions.firstSetup) firstTimeSetup()
        }
        else firstTimeSetup()*/
        firstTimeSetup()

        // This is called once client(the bot) is ready
        client.once('ready', () => {
            console.log("Stockpiler Discord Bot is ready!")
        })

        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isCommand()) return; // Checks whether the interaction is a command

            const commandName = interaction.commandName;

            if (commandName === 'sphelp') await sphelp(interaction) 
            else if (commandName === 'spsetamount') await spsetamount(interaction, client)
            else if (commandName === 'spstatus') await spstatus(interaction)
            else if (commandName === 'sptarget') {
                if (interaction.options.getSubcommand() === 'set') await spsettarget(interaction)
                else if (interaction.options.getSubcommand() === 'remove') await spremovetarget(interaction)
            }
            else if (commandName === 'spsetpassword') await spsetpassword(interaction)
            else if (commandName === 'splogichannel') {
                if (interaction.options.getSubcommand() === 'set') await spsetlogichannel(interaction, client)
                else if (interaction.options.getSubcommand() === 'remove') await spremovelogichannel(interaction, client)
            }
        });

        // Connect by logging into Discord
        client.login(process.env.token)
    }
    else {
        console.error("Failed to connect to MongoDB. Exiting now")
    }

}

main()
