import { Client, ChatInputCommandInteraction, GuildMember, TextChannel } from "discord.js";
import { getCollections } from '../mongoDB'
import generateStockpileMsg from "../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";
import checkPermissions from "../Utils/checkPermissions";
import mongoSanitize from "express-mongo-sanitize";
import checkTimeNotifs from "../Utils/checkTimeNotifs";

const spsettimeleft = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
    let stockpile = interaction.options.getString("stockpile")! // Tell typescript to shut up and it is non-null
    let timeLeft = interaction.options.getInteger("time")!

    if (!(await checkPermissions(interaction, "user", interaction.member as GuildMember))) return false

    if (!stockpile || !timeLeft) {
        await interaction.editReply({
            content: "Missing parameters"
        });
        return false
    }

    
    
    const collections = process.env.STOCKPILER_MULTI_SERVER === "true" ? getCollections(interaction.guildId) : getCollections()

    const disableTimeNotif: any = NodeCacheObj.get("disableTimeNotif")
    const timeCheckDisabled = process.env.STOCKPILER_MULTI_SERVER === "true" ? disableTimeNotif[interaction.guildId!] : disableTimeNotif
    if (timeCheckDisabled) {
        await interaction.editReply({ content: "Error: The time-checking feature of Storeman Bot is disabled for this server. Please use `/spdisabletime` to enable it." })
        return false
    }

    const cleanName = stockpile.replace(/\./g, "").replace(/\$/g, "")
    const searchQuery = new RegExp(cleanName, "i")
    const stockpileExist = await collections.stockpiles.findOne({ name: searchQuery })
    if (stockpileExist) {
        let updateObj: any = {
            timeLeft: new Date(timeLeft * 1000)
        }
        mongoSanitize.sanitize(updateObj, { replaceWith: "_" })
        await collections.stockpiles.updateOne({ name: searchQuery }, { $set: updateObj })
        await collections.stockpiles.updateOne({ name: searchQuery }, { $unset: {upperBound: 1} })
        await interaction.editReply({ content: `Updated the stockpile timer successfully. It is set to expire in: <t:${Math.floor(updateObj.timeLeft.getTime() / 1000)}:R>` })

        const stockpileTimesObj: any = NodeCacheObj.get("stockpileTimes")
            let stockpileTimes: any;
            if (process.env.STOCKPILER_MULTI_SERVER === "true") stockpileTimes = stockpileTimesObj[interaction.guildId!]
            else stockpileTimes = stockpileTimesObj
        const timerBP: any = NodeCacheObj.get("timerBP")
        let timeNotificationLeft = 4
        for (let x = 0; x < timerBP.length; x++) {
            const timeLeftProperty: any = updateObj.timeLeft
            const currentDate: any = new Date()
            if (((timeLeftProperty - currentDate) / 1000) <= timerBP[x]) {
                timeNotificationLeft = x

                break
            }
        }
        stockpileTimes[stockpileExist.name] = { timeLeft: updateObj.timeLeft, timeNotificationLeft: timeNotificationLeft }

        const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, refreshAll] = await generateStockpileMsg(true, interaction.guildId)
        await updateStockpileMsg(interaction.client,interaction.guildId, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, refreshAll])
        checkTimeNotifs(client, true, false, interaction.guildId!)
    }
    else await interaction.editReply({ content: "Error, the stockpile `" + stockpile + "` does not exist." })

    return true;
}

export default spsettimeleft
