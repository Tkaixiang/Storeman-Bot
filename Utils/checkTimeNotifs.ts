import { Client, TextChannel } from "discord.js"
import { getCollections } from "../mongoDB"
const {  roleMention } = require('@discordjs/builders');

let queue: Array<any> = []

const checkTimeNotifsQueue = async (client: Client, forceEdit: boolean=false): Promise<Boolean> => {
    queue.push({ client: client, forceEdit: forceEdit})

    if (queue.length === 1) {
        console.log("No queue ahead. Starting")

        checkTimeNotifs(queue[0].client, queue[0].forceEdit)
    }
    else {
        console.log("Update event ahead queued, current length in queue: " + queue.length)
    }

    return true
}
const checkTimeNotifs = async (client: Client, forceEdit: boolean=false) => {
    console.log("Checking time now")
    let edited = false
    const stockpileTimes: any = NodeCacheObj.get("stockpileTimes")
    const timerBP = <Number[]>NodeCacheObj.get("timerBP")
    const collections = getCollections()
    let warningMsg = `**Stockpile Expiry Warning**\nThe following stockpiles are about to expire, please kindly refresh them.\n\n`

    if (forceEdit) edited = true
    for (const stockpileName in stockpileTimes) {
        const timeLeftProperty: any = stockpileTimes[stockpileName].timeLeft
        const currentDate: any = new Date()
        
        if (stockpileTimes[stockpileName].timeNotificationLeft >= 0) {
            const currentTimeDiff = (timeLeftProperty - currentDate) / 1000
            if (currentTimeDiff <= timerBP[stockpileTimes[stockpileName].timeNotificationLeft]) {
                console.log("Stockpile warning triggered")
                // Detected a stockpile that has past the allocated boundary expiry time
                let newIndex = stockpileTimes[stockpileName].timeNotificationLeft - 1
                edited = true
                warningMsg += `- \`${stockpileName}\` expires in <t:${Math.floor(timeLeftProperty.getTime() / 1000)}:R>\n`
                stockpileTimes[stockpileName].timeNotificationLeft = newIndex // Set the stockpile to the next lowest boundry
            }
        }
    }

    if (edited) {
        const configObj = (await collections.config.findOne({}))!
        if ("channelId" in configObj) {
            if ("notifRoles" in configObj && warningMsg.length > 104) {
                warningMsg += "\n"
                for (let i = 0; i < configObj.notifRoles.length; i++) {
                    warningMsg += roleMention(configObj.notifRoles[i])
                }

            }
            const channelObj = client.channels.cache.get(configObj.channelId) as TextChannel
            if ("warningMsgId" in configObj) {
                try {
                    const stockpileMsg = await channelObj.messages.fetch(configObj.warningMsgId)
                    if (stockpileMsg) await stockpileMsg.delete()
                }
                catch (e) {
                    console.log(e)
                    console.log("Failed to delete warning msg")
                }
            }
            const MsgID = await channelObj.send(warningMsg)
            await collections.config.updateOne({}, { $set: { warningMsgId: MsgID.id } })
            console.log("Sent out warning msg")

        }
    }
    queue.splice(0, 1)
        if (queue.length > 0) {
            console.log("Finished 1, starting next in queue, remaining queue: " + queue.length)
            checkTimeNotifs(queue[0].client, queue[0].forceEdit)
        }

}

export default checkTimeNotifsQueue
