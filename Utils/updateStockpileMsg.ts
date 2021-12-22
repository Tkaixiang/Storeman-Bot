import { Client, TextChannel } from "discord.js"
import { getCollections } from '../mongoDB';
let queue: Array<any> = []

const updateStockpileMsgEntryPoint = async (client: Client, msg: [string, Array<string>, string, string]): Promise<Boolean> => {
    queue.push({client: client, msg: msg})

    if (queue.length === 1) {
        console.log("No queue ahead. Starting")

        updateStockpileMsg(queue[0].client, queue[0].msg)
    }
    else {
        console.log("Update event ahead queued, current length in queue: " + queue.length)
    }

    return true
}

const updateStockpileMsg = async (client: Client, msg: [string, Array<string>, string, string]): Promise<Boolean> => {
    const collections = getCollections()

    const configObj = (await collections.config.findOne({}))!
    let newMsgsSent = false

    // update msg if logi channel is set
    if ("channelId" in configObj) {
        const channelObj = client.channels.cache.get(configObj.channelId) as TextChannel
        let msgObj = await channelObj.messages.fetch(configObj.stockpileHeader)
        await msgObj.edit(msg[0])
        msgObj = await channelObj.messages.fetch(configObj.targetMsg)
        await msgObj.edit(msg[2])
        msgObj = await channelObj.messages.fetch(configObj.stockpileMsgsHeader)
        await msgObj.edit(msg[3])
        for (let i = 0; i < msg[1].length; i++) {
            if (i < configObj.stockpileMsgs.length) {
                msgObj = await channelObj.messages.fetch(configObj.stockpileMsgs[i])
                await msgObj.edit(msg[1][i])
            }
            else {
                // The issue here is that when adding a new stockpile, a new msg has to be sent
                // Unfortunately, it takes a long time to send that new msg, hence when 2 requests to add the same new stockpile happen
                // The 1st request wouldn't have updated the database that a new msg has already been sent, leading to another new msg being sent
                // and the 2nd request's configObj.stockpileMsgs overrides the 1st one
                const newMsg = await channelObj.send(msg[1][i])
                configObj.stockpileMsgs.push(newMsg.id)
                if (!newMsgsSent) newMsgsSent = true
            }
        }
        if (newMsgsSent) await collections.config.updateOne({}, { $set: { stockpileMsgs: configObj.stockpileMsgs } })
    }

    queue.splice(0, 1)
    if (queue.length > 0) {
        console.log("Finished 1, starting next in queue, remaining queue: " + queue.length)
        updateStockpileMsg(queue[0].client, queue[0].msg)
    }
    return true
}

export default updateStockpileMsgEntryPoint

