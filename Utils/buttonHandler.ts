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

        await interaction.editReply({ content: "Item `" + item + "` has been set to `" + amount + "` crates inside the stockpile `" + stockpileName + "`" })

        const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, stockpileNames] = await generateStockpileMsg(true)
        await updateStockpileMsg(interaction.client, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader], stockpileNames)

    }
    else if (command === "spsettimeleft") {
        if (!(await checkPermissions(interaction, "user", interaction.member as GuildMember))) return false

        await interaction.update({ content: "Working on it...", components: [] })
        const stockpile = splitted[1]

        const cleanName = stockpile.replace(/\./g, "_").replace(/\./g, "").replace(/\$/g, "")

        const stockpileExist = await collections.stockpiles.findOne({ name: cleanName })
        if (stockpileExist) {
            const newTimeLeft = new Date((new Date()).getTime() + 60*60*1000*48)
            await collections.stockpiles.updateOne({ name: cleanName }, { $set: { timeLeft: newTimeLeft } })
            await interaction.followUp({ content: "Updated the stockpile " + cleanName + " count down timer successfully", ephemeral: true })

            const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, stockpileNames] = await generateStockpileMsg(true)
            await updateStockpileMsg(interaction.client, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader], stockpileNames)
            checkTimeNotifs(interaction.client, true)
        }
        else {
            await interaction.followUp({ content: "Error: Stockpile " + cleanName + " does not exist", ephemeral: true })
        }

    }
    else if (command === "spsettarget") {
        if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false

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

        const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, stockpileNames] = await generateStockpileMsg(true)
        await updateStockpileMsg(interaction.client, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader], stockpileNames)

        await interaction.editReply({
            content: `Item \`${item}\` has been added with a target of minimum ${minimum_amount} crates and maximum ${maximum_amount !== 0 ? maximum_amount : "unlimited"} crates.`
        });
    }

    else if (command === "cancel") {
        await interaction.editReply({ content: "Command cancelled", components: [] })
    }
}

export default buttonHandler