import { Client, TextChannel } from "discord.js"
import { getCollections } from "../mongoDB"
import { roleMention } from '@discordjs/builders';
const eventName = "[Stockpile Expiry Checker]: "
let queue: Array<any> = []
let multiServerQueue: any = {}

const checkTimeNotifsQueue = async (client: Client, forceEdit: boolean = false, regularUpdate: boolean = false, guildID: string = "PLACEHOLDER"): Promise<Boolean> => {
    if (process.env.STOCKPILER_MULTI_SERVER === "true" && !regularUpdate) {
    
        if (!(guildID in multiServerQueue)) multiServerQueue[guildID] = []

        multiServerQueue[guildID].push({ client: client, forceEdit: forceEdit, regularUpdate: regularUpdate, guildID: guildID })

        if (multiServerQueue[guildID].length === 1) {
            console.log(eventName + "No time check event queue ahead. Starting")

            checkTimeNotifs(multiServerQueue[guildID][0].client, multiServerQueue[guildID][0].forceEdit, multiServerQueue[guildID][0].regularUpdate, multiServerQueue[guildID][0].guildID)
        }
        else {
            console.log(eventName + "Update event ahead queued, current length in queue: " + queue.length)
        }
    }
    else {
        queue.push({ client: client, forceEdit: forceEdit, regularUpdate: regularUpdate, guildID: guildID })

        if (queue.length === 1) {
            console.log(eventName + "No time check event queue ahead. Starting")

            checkTimeNotifs(queue[0].client, queue[0].forceEdit, queue[0].regularUpdate, queue[0].guildID)
        }
        else {
            console.log(eventName + "Update event ahead queued, current length in queue: " + queue.length)
        }
    }

    return true
}
const checkTimeNotifs = async (client: Client, forceEdit: boolean = false, regularUpdate: boolean = false, guildID: string = "PLACEHOLDER") => {
    if (process.env.STOCKPILER_MULTI_SERVER === "true") {
        if (regularUpdate) {
            const globalCollections = getCollections("global-settings")
            const disableTimeNotif: any = NodeCacheObj.get("disableTimeNotif")
            const globalConfigObj = await globalCollections.config.findOne({})
            for (let i = 0; i < globalConfigObj.serverIDList.length; i++) {
                // skip this server if it has disabled time-check notifications
                if (disableTimeNotif[globalConfigObj.serverIDList[i]]) continue

                console.log(eventName + "Checking time now for the guild with ID: " + globalConfigObj.serverIDList[i])
                let edited = false
                const stockpileTimesObj: any = NodeCacheObj.get("stockpileTimes")
                const stockpileTimes = stockpileTimesObj[globalConfigObj.serverIDList[i]]
                const timerBP = <Number[]>NodeCacheObj.get("timerBP")
                const prettyNameObj: any = NodeCacheObj.get("prettyName")
                const prettyName = prettyNameObj[globalConfigObj.serverIDList[i]]

                const collections = getCollections(globalConfigObj.serverIDList[i])
                let warningMsg = `**Stockpile Expiry Warning**\nThe following stockpiles are about to expire, please kindly refresh them.\n\n`

                if (forceEdit) edited = true
                for (const stockpileName in stockpileTimes) {
                    const timeLeftProperty: any = stockpileTimes[stockpileName].timeLeft
                    const currentDate: any = new Date()

                    if (stockpileTimes[stockpileName].timeNotificationLeft >= 0) {
                        const currentTimeDiff = (timeLeftProperty - currentDate) / 1000
                        if (currentTimeDiff <= timerBP[stockpileTimes[stockpileName].timeNotificationLeft]) {
                            console.log(eventName + "A stockpile has passed a set time left and is about to expire. Sending out warning.")
                            // Detected a stockpile that has past the allocated boundary expiry time
                            let newIndex = stockpileTimes[stockpileName].timeNotificationLeft - 1
                            edited = true
                            warningMsg += `- \`${stockpileName in prettyName ? prettyName[stockpileName] : stockpileName}\` expires in <t:${Math.floor(timeLeftProperty.getTime() / 1000)}:R> ${stockpileName in prettyName ? "[a.k.a " + prettyName[stockpileName] + "]" : ""}\n`
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
                        try {
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
                            console.log(eventName + "Sent out warning msg (Note: This does not constitute a stockpile is about to expire)")
                        }
                        catch (e) {
                            console.log(eventName + "An error occurred trying to send out the warning msg")
                            console.log(e)
                        }


                    }
                }

            }

        }
        else {
            console.log(eventName + "Checking time now for the guild with ID: " + guildID)
            let edited = false
            const stockpileTimesObj: any = NodeCacheObj.get("stockpileTimes")
            const stockpileTimes = stockpileTimesObj[guildID]
            const timerBP = <Number[]>NodeCacheObj.get("timerBP")
            const prettyNameObj: any = NodeCacheObj.get("prettyName")
            const prettyName = prettyNameObj[guildID]

            const collections = getCollections(guildID)
            let warningMsg = `**Stockpile Expiry Warning**\nThe following stockpiles are about to expire, please kindly refresh them.\n\n`

            if (forceEdit) edited = true
            for (const stockpileName in stockpileTimes) {
                const timeLeftProperty: any = stockpileTimes[stockpileName].timeLeft
                const currentDate: any = new Date()

                if (stockpileTimes[stockpileName].timeNotificationLeft >= 0) {
                    const currentTimeDiff = (timeLeftProperty - currentDate) / 1000
                    if (currentTimeDiff <= timerBP[stockpileTimes[stockpileName].timeNotificationLeft]) {
                        console.log(eventName + "A stockpile has passed a set time left and is about to expire. Sending out warning.")
                        // Detected a stockpile that has past the allocated boundary expiry time
                        let newIndex = stockpileTimes[stockpileName].timeNotificationLeft - 1
                        edited = true
                        warningMsg += `- \`${stockpileName in prettyName ? prettyName[stockpileName] : stockpileName}\` expires in <t:${Math.floor(timeLeftProperty.getTime() / 1000)}:R> ${stockpileName in prettyName ? "[a.k.a " + prettyName[stockpileName] + "]" : ""}\n`
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
                    try {
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
                        console.log(eventName + "Sent out warning msg (Note: This does not constitute a stockpile is about to expire)")
                    }
                    catch (e) {
                        console.log(eventName + "An error occurred trying to send out the warning msg")
                        console.log(e)
                    }


                }
            }
        }

    }
    else {
        const disableTimeNotif: any = NodeCacheObj.get("disableTimeNotif")
        if (disableTimeNotif) return false
        
        console.log(eventName + "Checking time now")
        let edited = false
        const stockpileTimes: any = NodeCacheObj.get("stockpileTimes")
        const timerBP = <Number[]>NodeCacheObj.get("timerBP")
        const prettyName: any = NodeCacheObj.get("prettyName")
        const collections = getCollections()
        let warningMsg = `**Stockpile Expiry Warning**\nThe following stockpiles are about to expire, please kindly refresh them.\n\n`

        if (forceEdit) edited = true
        for (const stockpileName in stockpileTimes) {
            const timeLeftProperty: any = stockpileTimes[stockpileName].timeLeft
            const currentDate: any = new Date()

            if (stockpileTimes[stockpileName].timeNotificationLeft >= 0) {
                const currentTimeDiff = (timeLeftProperty - currentDate) / 1000
                if (currentTimeDiff <= timerBP[stockpileTimes[stockpileName].timeNotificationLeft]) {
                    console.log(eventName + "A stockpile has passed a set time left and is about to expire. Sending out warning.")
                    // Detected a stockpile that has past the allocated boundary expiry time
                    let newIndex = stockpileTimes[stockpileName].timeNotificationLeft - 1
                    edited = true
                    warningMsg += `- \`${stockpileName in prettyName ? prettyName[stockpileName] : stockpileName}\` expires in <t:${Math.floor(timeLeftProperty.getTime() / 1000)}:R> ${stockpileName in prettyName ? "[a.k.a " + prettyName[stockpileName] + "]" : ""}\n`
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
                if (channelObj) {
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
                    console.log(eventName + "Sent out warning msg (Note: This does not constitute a stockpile is about to expire)")
                }
                else console.log(eventName + "Failed to send out warning msg")
                

            }
        }
    }
    if (process.env.STOCKPILER_MULTI_SERVER === "true" && !regularUpdate) {
        multiServerQueue[guildID].splice(0, 1)
        if (multiServerQueue[guildID].length > 0) {
            console.log(eventName + "Finished 1, starting next in queue, remaining queue: " + multiServerQueue[guildID].length)
            checkTimeNotifs(multiServerQueue[guildID][0].client, multiServerQueue[guildID][0].forceEdit, multiServerQueue[guildID][0].regularUpdate, multiServerQueue[guildID][0].guildID)
        }
    }
    else {
        queue.splice(0, 1)
        if (queue.length > 0) {
            console.log(eventName + "Finished 1, starting next in queue, remaining queue: " + queue.length)
            checkTimeNotifs(queue[0].client, queue[0].forceEdit, queue[0].regularUpdate, queue[0].guildID)
        }
    }



}

export default checkTimeNotifsQueue
