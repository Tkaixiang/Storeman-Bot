import { Client, TextChannel } from "discord.js"
import { getCollections } from '../mongoDB';

const updateStockpileMsg = async (client: Client, msg: [string, Array<string>, string]): Promise<Boolean> => {
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
        for (let i = 0; i < msg[1].length; i++) {
            if (i < configObj.stockpileMsgs.length) {
                msgObj = await channelObj.messages.fetch(configObj.stockpileMsgs[i])
                await msgObj.edit(msg[1][i])
            }
            else {
                const newMsg = await channelObj.send(msg[1][i])
                configObj.stockpileMsgs.push(newMsg)
                if (!newMsgsSent) newMsgsSent = true
            }
        }
        if (newMsgsSent) await collections.config.updateOne({}, { $set: { stockpileMsgs: configObj.stockpileMsgs } })
    }

    return true
}

export default updateStockpileMsg