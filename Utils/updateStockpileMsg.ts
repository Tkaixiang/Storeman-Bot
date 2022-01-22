import { Client, MessageActionRow, MessageButton, TextChannel } from "discord.js"
import { getCollections } from '../mongoDB';
import checkTimeNotifsQueue from "./checkTimeNotifs";
let queue: Array<any> = []

const updateStockpileMsgEntryPoint = async (client: Client, msg: [string, Array<string>, string, string], stockpileNames: String[]): Promise<Boolean> => {
    queue.push({ client: client, msg: msg, stockpileNames: stockpileNames })

    if (queue.length === 1) {
        console.log("No queue ahead. Starting")

        updateStockpileMsg(queue[0].client, queue[0].msg, queue[0].stockpileNames)
    }
    else {
        console.log("Update event ahead queued, current length in queue: " + queue.length)
    }

    return true
}

const updateStockpileMsg = async (client: Client, msg: [string, Array<string>, string, string], stockpileNames: String[]): Promise<Boolean> => {
    try {
        const collections = getCollections()

        const configObj = (await collections.config.findOne({}))!
        let editedMsgs = false
        let newMsgsSent = false
        let stockpileIndex = 0

        // update msg if logi channel is set
        if ("channelId" in configObj) {
            const channelObj = client.channels.cache.get(configObj.channelId) as TextChannel
            let msgObj = await channelObj.messages.fetch(configObj.stockpileHeader)
            await msgObj.edit(msg[0])
            msgObj = await channelObj.messages.fetch(configObj.stockpileMsgsHeader)
            await msgObj.edit(msg[3])
            for (let i = 0; i < msg[1].length; i++) {
                if (i < configObj.stockpileMsgs.length) {
                    try {
                        msgObj = await channelObj.messages.fetch(configObj.stockpileMsgs[i])
                        if (msg[1][i].slice(msg[1][i].length - 3) === "---") {
                            const row = new MessageActionRow()
                                .addComponents(
                                    new MessageButton()
                                        .setCustomId('spsettimeleft==' + stockpileNames[stockpileIndex])
                                        .setLabel("Refresh Timer")
                                        .setStyle('PRIMARY')
                                );
                            await msgObj.edit({ content: msg[1][i], components: [row] })
                            stockpileIndex += 1
                        }
                        else await msgObj.edit(msg[1][i])

                    }
                    catch (e) {
                        console.log(e)
                        console.log("Failed to edit msg, skipping...")
                    }
                }
                else {
                    // The issue here is that when adding a new stockpile, a new msg has to be sent
                    // Unfortunately, it takes a long time to send that new msg, hence when 2 requests to add the same new stockpile happen
                    // The 1st request wouldn't have updated the database that a new msg has already been sent, leading to another new msg being sent
                    // and the 2nd request's configObj.stockpileMsgs overrides the 1st one
                    if (msg[1][i].slice(msg[1][i].length - 3) === "---") {
                        const row = new MessageActionRow()
                            .addComponents(
                                new MessageButton()
                                    .setCustomId('spsettimeleft==' + stockpileNames[stockpileIndex])
                                    .setLabel("Refresh Timer")
                                    .setStyle('PRIMARY')
                            );
                        const newMsg = await channelObj.send({ content: msg[1][i], components: [row] })
                        configObj.stockpileMsgs.push(newMsg.id)
                        if (!editedMsgs) editedMsgs = true
                        stockpileIndex += 1
                    }
                    else {
                        const newMsg = await channelObj.send(msg[1][i])
                        configObj.stockpileMsgs.push(newMsg.id)
                        if (!editedMsgs) editedMsgs = true
                    }
                    newMsgsSent = true

                }
            }
            const difference = configObj.stockpileMsgs.length - msg[1].length
            for (let i = 0; i < difference; i++) {
                if (!editedMsgs) editedMsgs = true
                try {
                    msgObj = await channelObj.messages.fetch(configObj.stockpileMsgs[configObj.stockpileMsgs.length - 1 - i])
                    await msgObj.delete()
                }
                catch (e) {
                    console.log("Failed to delete last unused msg")
                }
                configObj.stockpileMsgs.pop()

            }

            let updateObj: any = {}
            // Send the target msg last
            if (newMsgsSent) {
                msgObj = await channelObj.messages.fetch(configObj.targetMsg)
                try {
                    await msgObj.delete()
                }
                catch (e) {
                    console.log("Failed to delete target msg, ignoring")
                }
                const newTargetMsgObj = await channelObj.send(msg[2])
                updateObj.targetMsg = newTargetMsgObj.id

                checkTimeNotifsQueue(client, true)
            }
            else {
                msgObj = await channelObj.messages.fetch(configObj.targetMsg)
                await msgObj.edit(msg[2])
            }

            if (editedMsgs) {
                updateObj.stockpileMsgs = configObj.stockpileMsgs
                await collections.config.updateOne({}, { $set: updateObj })
            } 
        }

        queue.splice(0, 1)
        if (queue.length > 0) {
            console.log("Finished 1, starting next in queue, remaining queue: " + queue.length)
            updateStockpileMsg(queue[0].client, queue[0].msg, queue[0].stockpileNames)
        }
        return true
    }
    catch (e) {
        console.log(e)
        console.log("An error occurred updating msgs, skipping this for now...")
        queue.splice(0, 1)
        if (queue.length > 0) {
            console.log("Finished 1, starting next in queue, remaining queue: " + queue.length)
            updateStockpileMsg(queue[0].client, queue[0].msg, queue[0].stockpileNames)
        }
        return false
    }
}

export default updateStockpileMsgEntryPoint

