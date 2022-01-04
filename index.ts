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
import sprole from './Commands/sprole'
import stockpilerUpdateStockpile from './Utils/stockpilerUpdateStockpile'
import spitems from './Commands/spitems'
import spsetorder from './Commands/spsetorder'
import buttonHandler from './Utils/buttonHandler'
import http from 'http'
import crypto from 'crypto'

require('dotenv').config()
const port = 8090
const host = '0.0.0.0'
const currentVersion = 4

declare global {
    var NodeCacheObj: NodeCache;
}

const firstTimeSetup = async (configOptions: any): Promise<void> => {
    // Run first-time setup
    const collections = getCollections()
    insertCommands()

    if (!("password" in configOptions)) {
    const password = crypto.randomBytes(32).toString('hex')
console.info("Generated a random password since none was previously set: " + password + ". You can change this using /spsetpassword via the bot")
await collections.config.insertOne({ version: currentVersion, password: password })
    }
    else await collections.config.insertOne({ version: currentVersion })
    console.info("First time setup/update completed.")
}
const main = async (): Promise<void> => {
    // Create a new client instance 
    const client = new Client({ intents: [Intents.FLAGS.GUILDS] })
    global.NodeCacheObj = new NodeCache();
    const itemList =  ['Dusk ce.III', 'Booker Storm Rifle Model 838', 'Aalto Storm Rifle 24', '7.92mm', 'Catara mo. II', 'KRN886-127 Gast Machine Gun', 'Malone MK.2', '12.7mm', 'PT-815 Smoke Grenade', 'Ferro 879', 'Cascadier 873', '8mm', 'Cometa T2-9', 'The Hangman 757', '0.44', 'Sampo Auto-Rifle 77', 'Argentir r.II Rifle', 'Volta r.I Repeater', 'Fuscina pi.I', 'Blakerow 871', 'KRR2-790 Omen', 'Clancy Cinder M3', 'No.2 Loughcaster', '7.62mm', 'Brasa Shotgun', 'Buckshot', 'The Pitch Gun mc.V', 'Lionclaw mc.VIII', 'No.1 "The Liar" Submachinegun', 'Fiddler Submachine Gun Model 868', '9mm SMG', 'KRR3-792 Auger', 'Clancy-Raca M4', '8.5mm', '20 Neville Anti-Tank Rifle', '20mm', 'Venom c.II 35', 'Bane 45', 'A.T.R.P.G. Shell', 'Bonesaw MK.3', 'A.T.R.P.G. Indirect Shell', 'Cremari Mortar', 'Mortar Flare Shell', 'Mortar Shrapnel Shell', 'Mortar Shell', 'BF5 White Ash Flask Grenade', 'Ignifist 30', 'Mounted Bonesaw MK.3', 'Green Ash Grenade', 'Bombastone Grenade', 'A3 Harpa Fragmentation Grenade', '150mm', 'Mammon 91-b', 'Daucus isg.III', '120mm', '300mm', '250mm', 'Anti-Tank Sticky Bomb', 'Cutler Launcher 4', 'R.P.G. Shell', '68mm AT', '75mm Round', '40mm Round', '30mm', 'Warhead', 'Binoculars', "Hydra's Whisper", 'Listening Kit', 'Radio Backpack', 'Alligator Charge', 'Shovel', 'Sledge Hammer', 'Abisme AT-99', 'Tripod', 'Hammer', 'Wrench', 'Buckhorn CCQ-18', 'Gas Mask', 'Gas Mask Filter', 'Radio', 'Rocket Booster', 'Bandages', 'First Aid Kit', 'Trauma Kit', 'Blood Plasma', 'Soldier Supplies', 'Diesel', 'Petrol', 'Aluminum Alloy', 'Bunker Supplies', 'Basic Materials', 'Explosive Materials', 'Garrison Supplies', 'Heavy Explosive Materials', 'Iron Alloy', 'Refined Materials', 'Salvage', 'Components', 'Sulfur', 'Aluminum', 'Iron', 'Wreckage', 'Concrete Materials', 'Crude Oil', "Specialist's Overcoat", 'Fabri Rucksack', 'Sapper Gear', "Grenadier's Baldric", 'Medic Fatigues', "Physician's Jacket", "Legionary's Oilcoat", 'Recon Camo', "Outrider's Mantle", 'Heavy Topcoat', 'Caoivish Parka', 'Legionary Fatigues', 'Infantry Battledress', "Tankman's Coveralls", 'Padded Boiler Suit', 'R-12 - "Salus" Ambulance', 'Dunne Responder 3e', 'T3 "Xiphos"', 'T12 "Actaeon" Tankette', "O'Brien v.121 Highlander", 'T5 "Percutio"', "O'Brien v.101 Freeman", "O'Brien v.110", 'BMS - Aquatipper', 'Blumfield LK205', 'R-15 - "Chariot"', 'Dunne Caravaner 2f', 'BMS - Universal Assembly Rig', 'BMS - Class 2 Mobile Auto-Crane', 'Noble Widow MK. XIV', 'AA-2 Battering Ram', '68-45 "Smelter" Heavy Field Gun', 'Collins Cannon 68mm', 'Balfour Rampart 40mm', 'Balfour Wolfhound 40mm', '120-68 "Koronides" Field Gun', 'G40 "Sagittarii"', 'Swallowtail 988/127-2', 'Balfour Falconer 250mm', 'BMS - Packmule Flatbed', 'BMS - Ironship', 'Type C - "Charon"', '74c-2 Ronan Meteora Gunship', '74b-1 Ronan Gunship', 'HH-d "Peltast"', 'HH-a "Javelin"', 'HH-b "Hoplite"', 'Niska Mk. II Blinder', 'Niska Mk. I Gun Motor Carriage', 'BMS - Scrap Hauler', 'AB-8 "Acheron"', 'AB-11 "Doru"', 'Mulloy APC', 'HC-2 "Scorpion"', 'Devitt-Caine Mk. IV MMR', 'H5 "Hatchet"', 'Devitt Ironhide Mk. IV', 'H-8 "Kraneska"', 'H-10 "Pelekys"', 'Devitt Mk. III', '86K-a "Bardiche"', 'Gallagher Outlaw Mk. II', '85K-b "Falchion"', '85K-a "Spatha"', 'Silverhand Chieftain - Mk. VI', 'Silverhand - Mk. IV', 'HC-7 "Ballista"', '03MM "Caster"', '00MS "Stinger"', 'Kivela Power Wheel 80-1', 'RR-3 "Stolon" Tanker.', 'Dunne Fuelrunner 2d', 'King Gallant Mk. II', 'King Spire Mk. I', 'UV-05a "Argonaut"', 'UV-24 "Icarus"', 'Drummond Spitfire 100d', 'UV-5c "Odyssey"', 'Drummond Loscann 55c', 'Drummond 100a', 'T20 "Ixion" Tankette', 'BMS - White Whale', 'R-1 Hauler', 'Dunne Leatherback 2a', 'R-5 "Atlas" Hauler', 'Dunne Loadlugger 3c', 'R-5b "Sisyphus" Hauler', 'Dunne Landrunner 12c', 'R-9 "Speartip" Escort"', 'Dunne Transport', 'Barbed Wire Pallet', 'Concrete Mixer', '68mm Anti-Tank Cannon', '50-500 "Thunderbolt" Cannon', 'Huber Exalt 150mm', 'Huber Lariat 120mm', '12.7 Anti Infantry Flak Gun', 'Metal Beam Pallet', 'Resource Container', 'Sandbag Pallet', 'Shipping Container', 'Small Shipping Container', 'Barbed Wire', 'Sandbags', 'Metal Beam', 'Lamentum mm.IV', '"Typhon" ra.XII', 'Culter Foebreaker', 'Ahti Model 2', 'Malone Ratcatcher Mk. 1', 'Copper', 'Copper Alloy']
    for (let i = 0; i < itemList.length; i++) {
        itemList[i] = itemList[i].replace(/\./g, "_").toLowerCase()
    }
    const listWithCrates = JSON.parse(JSON.stringify(itemList))
    for (let i = 0; i < itemList.length; i++) {
        listWithCrates.push(itemList[i] + " crate")
    }

    NodeCacheObj.set("itemList", itemList)
    NodeCacheObj.set("listWithCrates", listWithCrates)

    // Connect to mongoDB
    if (await open()) {
        const collections = getCollections()

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
                else if (commandName === "spremovestockpile") await spremovestockpile(interaction, client)
                else if (commandName === "sprole") {
                    if (interaction.options.getSubcommand() === 'set') await sprole(interaction, client, true)
                    else if (interaction.options.getSubcommand() === 'remove') await sprole(interaction, client, false)
                }
                else if (commandName === "spitems") await spitems(interaction)
                else if (commandName === "spsetorder") await spsetorder(interaction, client)
            }
            else if (interaction.isButton()) {
                buttonHandler(interaction)
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
