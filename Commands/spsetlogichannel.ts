import { Client, CommandInteraction, GuildMember, TextChannel } from "discord.js";
import { getCollections } from '../mongoDB';
import checkPermissions from "../Utils/checkPermissions";
import generateMsg from '../Utils/generateStockpileMsg'

const spsetlogichannel = async (interaction: CommandInteraction, client: Client): Promise<boolean> => {
    const channel = interaction.options.getChannel("channel")! // Tell typescript to shut up and it is non-null

    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false

    if (!channel) {
        await interaction.reply({
            content: "Missing parameters",
            ephemeral: true
        });
        return false
    }

    const collections = getCollections()
    const channelObj = client.channels.cache.get(channel.id) as TextChannel

    const configDoc = (await collections.config.findOne({}))!
    if ("stockpileHeader" in configDoc) {
        // Delete previous message if it exists
        const newChannelObj = client.channels.cache.get(configDoc.channelId) as TextChannel
        const msg = await newChannelObj.messages.fetch(configDoc.stockpileHeader)
        if (msg) await msg.delete()
        for (let i = 0; i < configDoc.stockpileMsgs.length; i++) {
            const stockpileMsg = await newChannelObj.messages.fetch(configDoc.stockpileMsgs[i])
            if (stockpileMsg) await stockpileMsg.delete()
        }
        const targetMsg = await newChannelObj.messages.fetch(configDoc.targetMsg)
        if (targetMsg) await targetMsg.delete()
    }
    const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader] = await generateMsg(false)
    const newMsg = await channelObj.send(stockpileHeader)
    const targetMsgID = await channelObj.send(targetMsg)
    const stockpileMsgsHeaderID = await channelObj.send(stockpileMsgsHeader)
    let stockpileMsgIDs: any = []
    for (let i = 0; i < stockpileMsgs.length; i++) {
        const temp = await channelObj.send(stockpileMsgs[i])
        stockpileMsgIDs.push(temp)
    }
    await collections.config.updateOne({}, { $set: { stockpileHeader: newMsg.id, stockpileMsgs: stockpileMsgIDs, targetMsg: targetMsgID, channelId: channel.id, stockpileMsgsHeader: stockpileMsgsHeaderID } })


    await interaction.reply({
        content: "Logi channel successfully set to '" + channel.name + "'",
        ephemeral: true
    });
    return true;
}

export default spsetlogichannel