import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { getCollections } from "../mongoDB";
import checkPermissions from "../Utils/checkPermissions";
import checkTimeNotifs from "../Utils/checkTimeNotifs";
import generateStockpileMsg from "../Utils/generateStockpileMsg";
import updateStockpileMsg from "../Utils/updateStockpileMsg";

const sprefresh = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {
    const stockpile = interaction.options.getString("stockpile")!

    if (!(await checkPermissions(interaction, "user", interaction.member as GuildMember))) return false

    const collections = process.env.STOCKPILER_MULTI_SERVER === "true" ? getCollections(interaction.guildId) : getCollections()

    await interaction.reply({ content: "Working on it...", ephemeral: true })

    if (stockpile) {
        const disableTimeNotif: any = NodeCacheObj.get("disableTimeNotif")
        const timeCheckDisabled = process.env.STOCKPILER_MULTI_SERVER === "true" ? disableTimeNotif[interaction.guildId!] : disableTimeNotif
        if (timeCheckDisabled) {
            await interaction.editReply({ content: "Error: The time-checking feature of Storeman Bot is disabled for this server. Please use `/spdisabletime` to enable it." })
            return false
        }

        const cleanName = stockpile.replace(/\./g, "_").replace(/\./g, "").replace(/\$/g, "")
        const searchQuery = new RegExp(cleanName, "i")

        const stockpileExist = await collections.stockpiles.findOne({ name: searchQuery })
        if (stockpileExist) {
            const newTimeLeft = new Date((new Date()).getTime() + 60 * 60 * 1000 * 50)
            await collections.stockpiles.updateOne({ name: searchQuery }, { $set: { timeLeft: newTimeLeft }, $unset: { upperBound: 1 } })
            await interaction.editReply({ content: "Updated the stockpile " + cleanName + " count down timer successfully" })

            const stockpileTimesObj: any = NodeCacheObj.get("stockpileTimes")
            let stockpileTimes: any;
            if (process.env.STOCKPILER_MULTI_SERVER === "true") stockpileTimes = stockpileTimesObj[interaction.guildId!]
            else stockpileTimes = stockpileTimesObj

            const timerBP: any = NodeCacheObj.get("timerBP")
            stockpileTimes[cleanName] = { timeLeft: newTimeLeft, timeNotificationLeft: timerBP.length - 1 }
            const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, refreshAll] = await generateStockpileMsg(true, interaction.guildId)
            await updateStockpileMsg(interaction.client, interaction.guildId, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, refreshAll])
            checkTimeNotifs(interaction.client, true, false, interaction.guildId!)
        }
        else {
            await interaction.followUp({ content: "Error: Stockpile " + cleanName + " does not exist", ephemeral: true })
        }
    }
    else {
        await collections.stockpiles.find({}).forEach(async (doc: any) => {
            const newTimeLeft = new Date((new Date()).getTime() + 60 * 60 * 1000 * 50)

            await collections.stockpiles.updateOne({ name: doc.name }, { $set: { timeLeft: newTimeLeft }, $unset: { upperBound: 1 } })
            const stockpileTimesObj: any = NodeCacheObj.get("stockpileTimes")
            let stockpileTimes: any;
            if (process.env.STOCKPILER_MULTI_SERVER === "true") stockpileTimes = stockpileTimesObj[interaction.guildId!]
            else stockpileTimes = stockpileTimesObj

            const timerBP: any = NodeCacheObj.get("timerBP")
            stockpileTimes[doc.name] = { timeLeft: newTimeLeft, timeNotificationLeft: timerBP.length - 1 }
        })

        const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, refreshAll] = await generateStockpileMsg(true, interaction.guildId)
        await updateStockpileMsg(interaction.client, interaction.guildId, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, refreshAll])
        checkTimeNotifs(interaction.client, true, false, interaction.guildId!)
        await interaction.editReply("Updated the timers of all your stockpiles.")
    }

    return true;
}

export default sprefresh
