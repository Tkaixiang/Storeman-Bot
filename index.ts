import { Client, CommandInteraction, Guild, Intents } from 'discord.js'
import { insertCommands } from './deploy-commands'
import { open, getCollections, getMongoClientObj } from './mongoDB'
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
import spaddprettyname from './Commands/spaddprettyname'
import spremoveprettyname from './Commands/spremoveprettyname'
import sppurgestockpile from './Commands/sppurgestockpile'
import spaddcode from './Commands/spaddcode'
import spremovecode from './Commands/spremovecode'
import spaddloc from './Commands/spaddloc'
import spremoveloc from './Commands/spremoveloc'
import splistloc from './Commands/splistloc'
import spfind from './Commands/spfind'
import spdisabletime from './Commands/spdisabletime'

require('dotenv').config()
const port = 8090
const host = '0.0.0.0'
const currentVersion = 16
const timerBP = [60 * 5, 60 * 10, 60 * 30, 60 * 60, 60 * 60 * 6, 60 * 60 * 12] // Timer breakpoints in seconds

declare global {
    var NodeCacheObj: NodeCache;
}


const updateFirstTimeSetup = async (newInstance: boolean): Promise<void> => {
    // Run first-time setup
    const collections = getCollections()
    insertCommands()

    if (newInstance) {
        const password = crypto.randomBytes(32).toString('hex')
        console.info("Generated a random password since none was previously set: " + password + ". You can change this using /spsetpassword via the bot")
        await collections.config.insertOne({ version: currentVersion, password: await argon2.hash(password) })
        console.log("Completed first-time setup")
    }
    else {
        await collections.config.updateOne({}, { $set: { version: currentVersion } })
        console.info("Completed Storeman Bot update")
    }

}

const guildCreateEventHandler = async (guild: Guild) => {

    const collections = getCollections(guild.id)
    const configObj = await collections.config.findOne({})
    if (!configObj) {
        // The bot has joined a new server 
        console.log("Bot has joined a new server named: " + guild.name + " with ID: " + guild.id)
        const password = crypto.randomBytes(32).toString('hex')
        await collections.config.insertOne({ password: await argon2.hash(password) })

        // Insert commands into that guild
        insertCommands(guild.id)

        // Add the server record into the global settings list
        const globalCollection = getCollections("global-settings")
        await globalCollection.config.updateOne({}, { $push: { serverIDList: guild.id } })

        const stockpileTimes: any = NodeCacheObj.get("stockpileTimes")
        const notifRoles: any = NodeCacheObj.get("notifRoles")
        const prettyName: any = NodeCacheObj.get("prettyName")

        stockpileTimes[guild.id] = {}
        notifRoles[guild.id] = []
        prettyName[guild.id] = {}
    }
}

const guildDeleteEventHandler = async (guildID: string) => {
    console.log("Bot has been kicked (or deleted) from the server with ID:" + guildID)
    const mongoClient = getMongoClientObj()
    const db = mongoClient.db('stockpiler-' + guildID)
    await db.dropDatabase()

    const collections = getCollections("global-settings")
    const configObj = await collections.config.findOne({})
    let found = false
    for (let i = 0; i < configObj.serverIDList.length; i++) {
        if (configObj.serverIDList[i] === guildID) {
            found = true
            configObj.serverIDList.splice(i, 1)
            break
        }
    }
    if (found) await collections.config.updateOne({}, { $set: { serverIDList: configObj.serverIDList } })

    const stockpileTime: any = NodeCacheObj.get("stockpileTime")
    const notifRoles: any = NodeCacheObj.get("notifRoles")
    const prettyName: any = NodeCacheObj.get("prettyName")
    delete stockpileTime[guildID]
    delete notifRoles[guildID]
    delete prettyName[guildID]

    console.log("Deleted the database and config records of the guild successfully")
}

const createCacheStartup = async (client: Client) => {
    if (process.env.STOCKPILER_MULTI_SERVER === "true") {
        console.log("Storeman bot is running in multi-server mode.")

        const collections = getCollections("global-settings")
        const configObj = await collections.config.findOne()

        // Obtain list of guild IDs from Discord API to check if it matches with the one stored in the DB
        const guildObjs = client.guilds.cache.toJSON()

        let listOfGuildObjs: Guild[] = []
        let listOfGuildIDs: string[] = []
        for (let i = 0; i < guildObjs.length; i++) {
            listOfGuildObjs.push(guildObjs[i])
            listOfGuildIDs.push(guildObjs[i].id)
        }

        if (configObj) {
            // Check if the guildID list has changed since the bot was down
            for (let i = 0; i < listOfGuildObjs.length; i++) {
                const currentID = listOfGuildIDs
                if (configObj.serverIDList.indexOf(currentID) === -1) {
                    // guildID from discord API not found inside our storage, execute createFunction
                    guildCreateEventHandler(listOfGuildObjs[i])
                }
            }
            for (let i = 0; i < configObj.serverIDList.length; i++) {
                const currentID = configObj.serverIDList[i]
                if (listOfGuildIDs.indexOf(currentID) === -1) {
                    // guildID from our database no longer exists in discord API, execute destroyFunction
                    guildDeleteEventHandler(currentID)
                }
            }

            if (configObj.version < currentVersion) {
                // Update all the commands since the version has changed
                for (let i = 0; i < configObj.serverIDList.length; i++) {
                    insertCommands(configObj.serverIDList[i])
                    await collections.config.updateOne({}, { $set: { version: currentVersion } })
                }
            }

            let notifRoles: any = {}
            let prettyName: any = {}
            let stockpileTime: any = {}
            let disableTimeNotif: any = {}
            for (let i = 0; i < configObj.serverIDList.length; i++) {
                // Create custom notifRoles and prettyNames cache object
                const serverCollections = getCollections(configObj.serverIDList[i])
                if ("notifRoles" in serverCollections.config) notifRoles[configObj.serverIDList[i]] = serverCollections.config.notifRoles
                else notifRoles[configObj.serverIDList[i]] = []
                if ("prettyName" in serverCollections.config) prettyName[configObj.serverIDList[i]] = serverCollections.config.prettyName
                else prettyName[configObj.serverIDList[i]] = {}

                // Create the disable time cache object
                if ("disableTimeNotif" in serverCollections.config) disableTimeNotif[configObj.serverIDList[i]] = serverCollections.config.disableTimeNotif
                else disableTimeNotif[configObj.serverIDList[i]] = false


                const stockpiles = await serverCollections.stockpiles.find({}).toArray()
                stockpileTime[configObj.serverIDList[i]] = {}
                for (let y = 0; y < stockpiles.length; y++) {
                    if ("timeLeft" in stockpiles[y]) {
                        let timeNotificationLeft = timerBP.length - 1
                        for (let x = 0; x < timerBP.length; x++) {
                            const timeLeftProperty: any = stockpiles[y].timeLeft
                            const currentDate: any = new Date()
                            if (((timeLeftProperty - currentDate) / 1000) <= timerBP[x]) {
                                timeNotificationLeft = x
                                break
                            }
                        }
                        if (timeNotificationLeft >= 1) timeNotificationLeft -= 1
                        stockpileTime[configObj.serverIDList[i]][stockpiles[y].name] = { timeLeft: stockpiles[y].timeLeft, timeNotificationLeft: timeNotificationLeft }
                    }
                }
            }

            NodeCacheObj.set("notifRoles", notifRoles)
            NodeCacheObj.set("prettyName", prettyName)
            NodeCacheObj.set("stockpileTimes", stockpileTime)
            NodeCacheObj.set("disableTimeNotif", disableTimeNotif)
        }
        else {
            for (let i = 0; i < listOfGuildObjs.length; i++) {
                guildCreateEventHandler(listOfGuildObjs[i])
            }
            await collections.config.insertOne({ version: currentVersion, serverIDList: listOfGuildIDs })
        }

        client.on('guildCreate', (guild) => { guildCreateEventHandler(guild) })

        client.on('guildDelete', async (guild) => { guildDeleteEventHandler(guild.id) })
    }
    else {
        // Create list of timeLefts till the stockpile expires
        const collections = getCollections()

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

        // Check whether to insert commands and do first-time setup
        if (process.env.NODE_ENV === "development") insertCommands()
        const configOptions = await collections.config.findOne({}, {})
        if (configOptions) {

            let notifRoles = []
            if ("notifRoles" in configOptions) notifRoles = configOptions.notifRoles
            NodeCacheObj.set("notifRoles", notifRoles)
            let prettyName: any = {}
            let disableTimeNotif: any = false
            if ("prettyName" in configOptions) prettyName = configOptions.prettyName
            NodeCacheObj.set("prettyName", prettyName)
            if ("disableTimeNotif" in configOptions) disableTimeNotif = configOptions.disableTimeNotif
            NodeCacheObj.set("disableTimeNotif", disableTimeNotif)


            if (configOptions.version) {
                if (configOptions.version < currentVersion) updateFirstTimeSetup(false)
            }
            else updateFirstTimeSetup(true)

        }
        else updateFirstTimeSetup(true)
    }
}

const main = async (): Promise<void> => {


    // Create a new client instance 
    const client = new Client({ intents: [Intents.FLAGS.GUILDS] })
    global.NodeCacheObj = new NodeCache({ checkperiod: 0, useClones: false });
    const csvData: Array<any> = await new Promise(function (resolve, reject) {
        let fetchData: any = [];
        fs.createReadStream('ItemNumbering.csv')
            .pipe(csv())
            .on('data', (row) => {
                fetchData.push(row)
            })
            .on('end', () => {
                console.log('Item List CSV file successfully processed');
                resolve(fetchData);
            })
            .on('error', reject);
    })
    let itemList: String[] = []
    let listWithCrates: String[] = []
    let itemListBoth: String[] = []
    let lowerToOriginal: any = {}
    let itemListCategoryMapping: any = {}

    for (let i = 0; i < csvData.length; i++) {
        const loweredName = csvData[i].Name.slice().replace(/\./g, "_").toLowerCase()
        itemList.push(loweredName)
        listWithCrates.push(loweredName + " crate")
        itemListBoth.push(loweredName)
        itemListBoth.push(loweredName + " crate")
        lowerToOriginal[loweredName] = csvData[i].Name
        lowerToOriginal[loweredName + " crate"] = csvData[i].Name + " crate"

        if (csvData[i].StockpileCategory === "Vehicle") {
            itemListCategoryMapping[loweredName] = csvData[i].StockpileCategory
            itemListCategoryMapping[loweredName + " crate"] = csvData[i].StockpileCategory + " Crate"
        }
        else {
            itemListCategoryMapping[loweredName] = csvData[i].StockpileCategory
            itemListCategoryMapping[loweredName + " crate"] = csvData[i].StockpileCategory
        }

    }

    const LocationCSV: Array<any> = await new Promise(function (resolve, reject) {
        let fetchData: any = [];
        fs.createReadStream('Locs.csv')
            .pipe(csv())
            .on('data', (row) => {
                fetchData.push(row)
            })
            .on('end', () => {
                console.log('Location CSV file successfully processed');
                resolve(fetchData);
            })
            .on('error', reject);
    })
    let locationMappings: any = {}
    for (let i = 0; i < LocationCSV.length; i++) {
        locationMappings[LocationCSV[i].Code.toLowerCase()] = LocationCSV[i].Translation
    }


    NodeCacheObj.set("itemList", itemList)
    NodeCacheObj.set("itemListBoth", itemListBoth)
    NodeCacheObj.set("listWithCrates", listWithCrates)
    NodeCacheObj.set("lowerToOriginal", lowerToOriginal)
    NodeCacheObj.set("itemListCategoryMapping", itemListCategoryMapping)
    NodeCacheObj.set("locationMappings", locationMappings)


    NodeCacheObj.set("timerBP", timerBP)

    // Connect to mongoDB
    if (await open()) {

        setInterval(checkTimeNotifs, 1000 * 60, client, false, true)

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

        // This is called once client(the bot) is ready
        client.once('ready', async () => {
            await createCacheStartup(client)
            console.log("Storeman Bot is ready!")
            client.user?.setActivity("/sphelp")
        })



        client.on('interactionCreate', async (interaction) => {
            if (interaction.isCommand()) {
                try {
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
                        else if (interaction.options.getSubcommand() === 'purge') await sppurgestockpile(interaction, client)
                    }
                    else if (commandName === "sprole") {
                        if (interaction.options.getSubcommand() === 'set') await sprole(interaction, client, true)
                        else if (interaction.options.getSubcommand() === 'remove') await sprole(interaction, client, false)
                    }
                    else if (commandName === "spnotif") {
                        if (interaction.options.getSubcommand() === 'add') await spnotif(interaction, client, true)
                        else if (interaction.options.getSubcommand() === 'remove') await spnotif(interaction, client, false)
                    }
                    else if (commandName === "spprettyname") {
                        if (interaction.options.getSubcommand() === 'add') await spaddprettyname(interaction, client)
                        else if (interaction.options.getSubcommand() === 'remove') await spremoveprettyname(interaction, client)
                    }
                    else if (commandName === "spcode") {
                        if (interaction.options.getSubcommand() === 'add') await spaddcode(interaction, client)
                        else if (interaction.options.getSubcommand() === 'remove') await spremovecode(interaction, client)
                    }
                    else if (commandName === "sploc") {
                        if (interaction.options.getSubcommand() === 'add') await spaddloc(interaction, client)
                        else if (interaction.options.getSubcommand() === 'remove') await spremoveloc(interaction, client)
                        else if (interaction.options.getSubcommand() === 'list') await splistloc(interaction)
                    }
                    else if (commandName === "spitems") await spitems(interaction)
                    else if (commandName === "spsetorder") await spsetorder(interaction, client)
                    else if (commandName === "spsettimeleft") await spsettimeleft(interaction, client)
                    else if (commandName === "spfind") await spfind(interaction)
                    else if (commandName === "spdisabletime") await spdisabletime(interaction, client)
                }
                catch (e) {
                    console.log("[!!!]: An error has occured in the command " + interaction.commandName + ". Please kindly report this to the developer on Discord (Tkai#8276)")
                    interaction.followUp({content: "[❗❗❗] An error has occurred in Storeman Bot for the command `" + interaction.commandName + "`. Please kindly send this to the developer on Discord at Tkai#8276. \n\n Error Log: \n\n" + JSON.stringify(e)})
                }
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
