import { Client, TextChannel } from "discord.js"
import { getCollections } from '../mongoDB';

const updateStockpileMsg = async (client: Client, msg: string): Promise<Boolean> => {
    const collections = getCollections()

    const configObj = (await collections.config.findOne({}))!

    // update msg if logi channel is set
    if ("channelId" in configObj) {
        const channelObj = client.channels.cache.get(configObj.channelId) as TextChannel
        const msgObj = await channelObj.messages.fetch(configObj.logiMessage)
        await msgObj.edit(msg)
    }
   
    return true
}

export default updateStockpileMsg