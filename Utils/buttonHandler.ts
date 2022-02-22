import { GuildMember, MessageComponentInteraction } from "discord.js";
import mongoSanitize from "express-mongo-sanitize";
import { getCollections } from "../mongoDB";
import checkPermissions from "./checkPermissions";
import checkTimeNotifs from "./checkTimeNotifs";
import generateStockpileMsg from "./generateStockpileMsg";
import updateStockpileMsg from "./updateStockpileMsg";

const buttonHandler = async (interaction: MessageComponentInteraction) => {
    const splitted = interaction.customId.split("==")
    const command = splitted[0]
    const collections = getCollections()


    if (command === "spsetamount") {
        if (!(await checkPermissions(interaction, "user", interaction.member as GuildMember))) return false
        const lowerToOriginal: any = NodeCacheObj.get("lowerToOriginal")

        await interaction.update({ content: "Working on it...", components: [] })
        const item = splitted[1]
        const amount = parseInt(splitted[2])
        const stockpileName = splitted[3]

        const cleanitem = item.replace(/\./g, "_").toLowerCase()

        const stockpileExist = await collections.stockpiles.findOne({ name: stockpileName })
        if (stockpileExist) {
            if (amount > 0) stockpileExist.items[cleanitem] = amount
            else delete stockpileExist.items[cleanitem]
            mongoSanitize.sanitize(stockpileExist.items, { replaceWith: "_" })
            await collections.stockpiles.updateOne({ name: stockpileName.replace(/\./g, "").replace(/\$/g, "") }, { $set: { items: stockpileExist.items, lastUpdated: new Date() } })
        }
        else {
            let itemObject: any = {}
            if (amount > 0) itemObject[cleanitem] = amount

            mongoSanitize.sanitize(itemObject, { replaceWith: "_" })
            await collections.stockpiles.insertOne({ name: stockpileName.replace(/\./g, "").replace(/\$/g, ""), items: itemObject, lastUpdated: new Date() })
            await collections.config.updateOne({}, { $push: { orderSettings: stockpileName.replace(/\./g, "").replace(/\$/g, "") } })
        }

        await interaction.followUp({ content: "Item `" + lowerToOriginal[item] + "` has been set to `" + amount + "` crates inside the stockpile `" + stockpileName + "`" })

        const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader] = await generateStockpileMsg(true)
        await updateStockpileMsg(interaction.client, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader])

    }
    else if (command === "spsettimeleft") {
        if (!(await checkPermissions(interaction, "user", interaction.member as GuildMember))) return false

        await interaction.update({ content: "Working on it...", components: [] })
        const stockpile = splitted[1]

        const cleanName = stockpile.replace(/\./g, "_").replace(/\./g, "").replace(/\$/g, "")
        const searchQuery = new RegExp(cleanName, "i")

        const stockpileExist = await collections.stockpiles.findOne({ name: searchQuery })
        if (stockpileExist) {
            const newTimeLeft = new Date((new Date()).getTime() + 60 * 60 * 1000 * 48)
            await collections.stockpiles.updateOne({ name: searchQuery }, { $set: { timeLeft: newTimeLeft }})
            await collections.stockpiles.updateOne({ name: searchQuery }, { $unset: { upperBound: 1 } })
            await interaction.followUp({ content: "Updated the stockpile " + cleanName + " count down timer successfully", ephemeral: true })

            const stockpileTimes: any = NodeCacheObj.get("stockpileTimes")
            const timerBP: any = NodeCacheObj.get("timerBP")
            stockpileTimes[cleanName] = { timeLeft: newTimeLeft, timeNotificationLeft: timerBP.length - 1 }
            const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader] = await generateStockpileMsg(true)
            await updateStockpileMsg(interaction.client, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader])
            checkTimeNotifs(interaction.client, true)
        }
        else {
            await interaction.followUp({ content: "Error: Stockpile " + cleanName + " does not exist", ephemeral: true })
        }

    }
    else if (command === "spsettarget") {
        if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false
        const lowerToOriginal: any = NodeCacheObj.get("lowerToOriginal")

        await interaction.update({ content: "Working on it...", components: [] })

        let item = splitted[1]! // Tell typescript to shut up and it is non-null
        const minimum_amount = parseInt(splitted[2])
        let maximum_amount = parseInt(splitted[3])

        const cleanitem = item.replace(/\./g, "_").toLowerCase()

        let updateObj: any = {}
        updateObj[cleanitem] = { min: minimum_amount, max: maximum_amount }
        mongoSanitize.sanitize(updateObj, { replaceWith: "_" })
        if ((await collections.targets.updateOne({}, { $set: updateObj })).modifiedCount === 0) {
            await collections.targets.insertOne(updateObj)
        }

        await interaction.followUp({
            content: `Item \`${lowerToOriginal[cleanitem]}\` has been added with a target of minimum ${minimum_amount} crates and maximum ${maximum_amount !== 0 ? maximum_amount : "unlimited"} crates.`
        });
    }
    else if (command === "spfind") {
        if (!(await checkPermissions(interaction, "user", interaction.member as GuildMember))) return false

        await interaction.update({ content: "Working on it...", components: [] })

        let item = splitted[1]! // Tell typescript to shut up and it is non-null
        const lowerToOriginal: any = NodeCacheObj.get("lowerToOriginal")
        const locationMappings: any = NodeCacheObj.get("locationMappings")
        const collections = getCollections()
    
        const cleanitem = item.replace(/\$/g, "").replace(/\./g, "").toLowerCase()

        let msg = "Stockpiles in which `" + lowerToOriginal[cleanitem] + "` was found in: \n\n"

        const stockpiles = await collections.stockpiles.find({}).toArray()
        const configObj = (await collections.config.findOne({}))!
        let stockpileLocations: any = {}

        if ("stockpileLocations" in configObj) stockpileLocations = configObj.stockpileLocations

        for (let i = 0; i < stockpiles.length; i++) {
            const current = stockpiles[i]
            if (cleanitem in current.items) {
                msg += `**__${current.name}__**${current.name in stockpileLocations ? " (Location: " + locationMappings[stockpileLocations[current.name]] + ")" : ""}:\n`
                msg += current.items[cleanitem] + " - " + lowerToOriginal[cleanitem] + "\n"

                if (cleanitem.indexOf("crate") !== -1) {
                    // Since the item the user is searching for is a crated item, search for its non crated version as well 
                    const nonCratedItem = cleanitem.replace(" crate", "")
                    if (nonCratedItem in current.items) msg += current.items[nonCratedItem] + " - `" + lowerToOriginal[nonCratedItem] + "`\n"
                }
                else {
                    // Since the item the user is searching for is a non-crated item, search for its crated version as well
                    const cratedItem = cleanitem + " crate"
                    if (cratedItem in current.items) msg += current.items[cratedItem] + " - `" + lowerToOriginal[cratedItem] + "`\n"
                }
            }
            else {
                // Item is not inside, try finding the crated/non-crated version of that item
                if (cleanitem.indexOf("crate") !== -1) {
                    // Since the item the user is searching for is a crated item, search for its non crated version as well 
                    const nonCratedItem = cleanitem.replace(" crate", "")
                    if (nonCratedItem in current.items) {
                        msg += `**__${current.name}__**${current.name in stockpileLocations ? " (Location: " + locationMappings[stockpileLocations[current.name]] + ")" : ""}:\n`
                        msg += current.items[nonCratedItem] + " - `" + lowerToOriginal[nonCratedItem] + "`\n"
                    }
                }
                else {
                    // Since the item the user is searching for is a non-crated item, search for its crated version as well
                    const cratedItem = cleanitem + " crate"
                    if (cratedItem in current.items) {
                        msg += `**__${current.name}__**${current.name in stockpileLocations ? " (Location: " + locationMappings[stockpileLocations[current.name]] + ")" : ""}:\n`
                        msg += current.items[cratedItem] + " - `" + lowerToOriginal[cratedItem] + "`\n"
                    }
                }
            }
        }

        while (msg.length > 0) {
            if (msg.length > 2000) {
                const sliced = msg.slice(0, 2000)
                const lastEnd = sliced.lastIndexOf("\n")
                const finalMsg = sliced.slice(0, lastEnd)

                await interaction.followUp({
                    content: finalMsg,
                    ephemeral: true
                });
                msg = msg.slice(lastEnd, msg.length)
            }
            else {
                await interaction.followUp({
                    content: msg,
                    ephemeral: true
                });
                msg = ""
            }
        }
    }
    else if (command === "sppurgestockpile") {
        if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false

        await interaction.update({ content: "Working on it...", components: [] })
        await collections.stockpiles.deleteMany({})
        await collections.config.updateOne({}, { $unset: { orderSettings: 1, prettyName: 1, code: 1 } })
        NodeCacheObj.set("prettyName", {})
        NodeCacheObj.set("stockpileTimes", {})


        const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader] = await generateStockpileMsg(true)
        await updateStockpileMsg(interaction.client, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader])

        await interaction.followUp({
            content: `All stockpiles have been purged`
        });
    }

    else if (command === "cancel") {
        await interaction.update({ content: "Command cancelled", components: [] })
    }
}

export default buttonHandler
