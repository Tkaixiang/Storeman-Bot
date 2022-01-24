import { Client, CommandInteraction, GuildMember, TextChannel } from "discord.js";
import { getCollections } from '../mongoDB'
import generateStockpileMsg from "../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";
import checkPermissions from "../Utils/checkPermissions";
import mongoSanitize from "express-mongo-sanitize";
import checkTimeNotifs from "../Utils/checkTimeNotifs";

const spsettimeleft = async (interaction: CommandInteraction, client: Client): Promise<boolean> => {
    let stockpile = interaction.options.getString("stockpile")! // Tell typescript to shut up and it is non-null
    let timeLeft = interaction.options.getInteger("time")!

    if (!(await checkPermissions(interaction, "user", interaction.member as GuildMember))) return false

    if (!stockpile || !timeLeft) {
        await interaction.reply({
            content: "Missing parameters",
            ephemeral: true
        });
        return false
    }

    await interaction.reply({ content: 'Working on it', ephemeral: true });
    const collections = getCollections()
    const cleanName = stockpile.replace(/\./g, "").replace(/\$/g, "")
    const stockpileExist = await collections.stockpiles.findOne({ name: cleanName })
    if (stockpileExist) {
        let updateObj: any = {
            timeLeft: new Date(timeLeft * 1000)
        }
        mongoSanitize.sanitize(updateObj, { replaceWith: "_" })
        await collections.stockpiles.updateOne({ name: cleanName }, { $set: updateObj })
        await interaction.editReply({ content: `Updated the stockpile timer successfully. It is set to expire in: <t:${Math.floor(updateObj.timeLeft.getTime() / 1000)}:R>` })

        const stockpileTimes: any = NodeCacheObj.get("stockpileTimes")
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
        stockpileTimes[cleanName] = { timeLeft: updateObj.timeLeft, timeNotificationLeft: timeNotificationLeft }

        const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader] = await generateStockpileMsg(true)
        await updateStockpileMsg(interaction.client, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader])
        checkTimeNotifs(client, true)
    }
    else await interaction.editReply({ content: "Error, the stockpile `" + stockpile + "` does not exist." })

    return true;
}

export default spsettimeleft
