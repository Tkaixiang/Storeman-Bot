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
import spremovestockpile from './Commands/spremovestockpile'
import spaddstockpile from './Commands/spaddstockpile'
import spnotif from './Commands/sptimeoutnotif'
import sprole from './Commands/sprole'
import stockpilerUpdateStockpile from './Utils/stockpilerUpdateStockpile'
import spitems from './Commands/spitems'
import spsetorder from './Commands/spsetorder'
import buttonHandler from './Utils/buttonHandler'
import checkTimeNotifs from './Utils/checkTimeNotifs'
import http from 'http'
import crypto from 'crypto'
import argon2 from 'argon2';
import spsettimeleft from './Commands/spsettimeleft';
import fs from 'fs';
import csv from 'csv-parser';

require('dotenv').config()
const port = 8090
const host = '0.0.0.0'
const currentVersion = 7
const timerBP = [60 * 5, 60 * 10, 60 * 30, 60 * 60, 60 * 60 * 6, 60 * 60 * 12] // Timer breakpoints in seconds

declare global {
    var NodeCacheObj: NodeCache;
}


const firstTimeSetup = async (configOptions: any): Promise<void> => {
    // Run first-time setup
    const collections = getCollections()
    insertCommands()

    if (!configOptions || !("password" in configOptions)) {
        const password = crypto.randomBytes(32).toString('hex')
        console.info("Generated a random password since none was previously set: " + password + ". You can change this using /spsetpassword via the bot")
        await collections.config.insertOne({ version: currentVersion, password: await argon2.hash(password) })
    }
    else await collections.config.updateOne({}, { $set: { version: currentVersion } })
    console.info("First time setup/update completed.")
}

const main = async (): Promise<void> => {
    

    // Create a new client instance 
    const client = new Client({ intents: [Intents.FLAGS.GUILDS] })
    global.NodeCacheObj = new NodeCache({ checkperiod: 0, useClones: false });
    const csvData: Array<any> = await new Promise(function(resolve,reject){
        let fetchData: any = [];
        fs.createReadStream('ItemNumbering.csv')
            .pipe(csv())
            .on('data', (row) => {
               fetchData.push(row)
            })
            .on('end', () => {
                console.log('CSV file successfully processed');
                resolve(fetchData);
            })
            .on('error', reject); 
    })
    let itemList: String[] = []
    let listWithCrates: String[] = []
    let lowerToOriginal: any = {}
    let itemListCategoryMapping: any = {}
    for (let i = 0; i < csvData.length; i++) {
        const loweredName = csvData[i].Name.slice().replace(/\./g, "_").toLowerCase()
        itemList.push(loweredName)
        listWithCrates.push(loweredName + " crate")
        lowerToOriginal[loweredName] = csvData[i].Name
        lowerToOriginal[loweredName + " crate"] = csvData[i].Name + " crate"
        itemListCategoryMapping[loweredName] = csvData[i].StockpileCategory
    }


    NodeCacheObj.set("itemList", itemList)
    NodeCacheObj.set("listWithCrates", listWithCrates)
    NodeCacheObj.set("lowerToOriginal", lowerToOriginal)
    NodeCacheObj.set("itemListCategoryMapping", itemListCategoryMapping)
   

    NodeCacheObj.set("timerBP", timerBP)

    // Connect to mongoDB
    if (await open()) {
        const collections = getCollections()

        // Create list of timeLefts till the stockpile expires
        const stockpiles = await collections.stockpiles.find({}).toArray()
        let stockpileTime: any = {}
        for (let i = 0; i < stockpiles.length; i++) {
            if ("timeLeft" in stockpiles[i]) {
                let timeNotificationLeft = timerBP.length - 1
                for (let x = 0; x < timerBP.length; x++) {
                    const timeLeftProperty: any = stockpiles[i].timeLeft
                    const currentDate: any = new Date()
                    if (((timeLeftProperty - currentDate) / 1000) <= timerBP[x]) {
                        timeNotificationLeft = x
                        break
                    }
                }
                if (timeNotificationLeft >= 1) timeNotificationLeft -= 1
                stockpileTime[stockpiles[i].name] = { timeLeft: stockpiles[i].timeLeft, timeNotificationLeft: timeNotificationLeft }
            }
        }
        NodeCacheObj.set("stockpileTimes", stockpileTime)

        setInterval(checkTimeNotifs, 1000 * 60, client)

        // Start HTTP server
        const server = http.createServer((request, response) => {
            if (request.method == 'POST') {
                let body = ''
                request.on('data', (data) => {
                    body += data
                })
                request.on('end', () => {
                    try {
                        stockpilerUpdateStockpile(client, JSON.parse(body), response)
                    }
                    catch (e) {
                        console.error(e)
                    }

                })
            }
        })

        server.listen(port, host)
        console.log(`HTTP server now listening at http://${host}:${port}`)

        if (process.env.NODE_ENV === "development") insertCommands()
        const configOptions = await collections.config.findOne({}, {})
        if (configOptions) {

            let notifRoles = []
            if ("notifRoles" in configOptions) notifRoles = configOptions.notifRoles
            NodeCacheObj.set("notifRoles", notifRoles)


            if (configOptions.version) {
                if (configOptions.version < currentVersion) firstTimeSetup(configOptions)
            }
            else firstTimeSetup(configOptions)
        }
        else firstTimeSetup(configOptions)


        // This is called once client(the bot) is ready
        client.once('ready', () => {
            console.log("Stockpiler Discord Bot is ready!")
            client.user?.setActivity("/sphelp")
        })

        client.on('interactionCreate', async (interaction) => {
            if (interaction.isCommand()) {

                const commandName = interaction.commandName;

                if (commandName === 'sphelp') await sphelp(interaction)
                else if (commandName === 'spsetamount') await spsetamount(interaction, client)
                else if (commandName === 'spstatus') await spstatus(interaction)
                else if (commandName === 'sptarget') {
                    if (interaction.options.getSubcommand() === 'set') await spsettarget(interaction, client)
                    else if (interaction.options.getSubcommand() === 'remove') await spremovetarget(interaction, client)
                }
                else if (commandName === 'spsetpassword') await spsetpassword(interaction)
                else if (commandName === 'splogichannel') {
                    if (interaction.options.getSubcommand() === 'set') await spsetlogichannel(interaction, client)
                    else if (interaction.options.getSubcommand() === 'remove') await spremovelogichannel(interaction, client)
                }
                else if (commandName === "spstockpile") {
                    if (interaction.options.getSubcommand() === 'add') await spaddstockpile(interaction, client)
                    else if (interaction.options.getSubcommand() === 'remove') await spremovestockpile(interaction, client)
                }
                else if (commandName === "sprole") {
                    if (interaction.options.getSubcommand() === 'set') await sprole(interaction, client, true)
                    else if (interaction.options.getSubcommand() === 'remove') await sprole(interaction, client, false)
                }
                else if (commandName === "spnotif") {
                    if (interaction.options.getSubcommand() === 'add') await spnotif(interaction, client, true)
                    else if (interaction.options.getSubcommand() === 'remove') await spnotif(interaction, client, false)
                }
                else if (commandName === "spitems") await spitems(interaction)
                else if (commandName === "spsetorder") await spsetorder(interaction, client)
                else if (commandName === "spsettimeleft") await spsettimeleft(interaction, client)
            }
            else if (interaction.isButton()) {
                buttonHandler(interaction)
            }
        });

        // Connect by logging into Discord
        client.login(process.env.STOCKPILER_TOKEN)
    }
    else {
        console.error("Failed to connect to MongoDB. Exiting now")
    }

}

main()
