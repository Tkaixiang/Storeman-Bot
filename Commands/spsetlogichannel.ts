import { Client, CommandInteraction, GuildMember, MessageActionRow, MessageButton, TextChannel } from "discord.js";
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

    await interaction.reply({ content: 'Working on it', ephemeral: true });

    const collections = getCollections()
    const channelObj = client.channels.cache.get(channel.id) as TextChannel

    const configDoc = (await collections.config.findOne({}))!
    if ("stockpileHeader" in configDoc) {
        // Delete previous message if it exists
        const newChannelObj = client.channels.cache.get(configDoc.channelId) as TextChannel
        try {
            const msg = await newChannelObj.messages.fetch(configDoc.stockpileMsgsHeader)
            await msg.delete()
        }
        catch (e) {
            console.log("Failed to delete stockpileMsgsHeader")
        }
        try {
            const msg = await newChannelObj.messages.fetch(configDoc.stockpileHeader)
            await msg.delete()
        }
        catch (e) {
            console.log("Failed to delete msg")
        }
        for (let i = 0; i < configDoc.stockpileMsgs.length; i++) {
            try {
                const stockpileMsg = await newChannelObj.messages.fetch(configDoc.stockpileMsgs[i])
                if (stockpileMsg) await stockpileMsg.delete()
            }
            catch (e) {
                console.log("Failed to delete msg")
            }
        }
        try {
            for (let i = 0; i < configDoc.targetMsg.length; i++) {
            const targetMsgObj = await newChannelObj.messages.fetch(configDoc.targetMsg[i])
            if (targetMsgObj) await targetMsgObj.delete()
            }
        }
        catch (e) {
            console.log("Failed to delete msg")
        }
    }
    const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader] = await generateMsg(false)
    const newMsg = await channelObj.send(stockpileHeader)
    const stockpileMsgsHeaderID = await channelObj.send(stockpileMsgsHeader)
    let stockpileMsgIDs: any = []
    let stockpileIndex = 0
    for (let i = 0; i < stockpileMsgs.length; i++) {
        
        if (typeof stockpileMsgs[i] !== "string") {
            const temp = await channelObj.send({ content: stockpileMsgs[i][0], components: [stockpileMsgs[i][1]] })
            stockpileMsgIDs.push(temp.id)
            stockpileIndex += 1
        }
        else {
            const temp = await channelObj.send(stockpileMsgs[i])
            stockpileMsgIDs.push(temp.id)
        }


    }
    let targetMsgIDs: String[] = []
    for (let i = 0; i < targetMsg.length; i++) {
        const targetMsgID = await channelObj.send(targetMsg[i])
        targetMsgIDs.push(targetMsgID.id)
    }
   
    await collections.config.updateOne({}, { $set: { stockpileHeader: newMsg.id, stockpileMsgs: stockpileMsgIDs, targetMsg: targetMsgIDs, channelId: channel.id, stockpileMsgsHeader: stockpileMsgsHeaderID.id } })


    await interaction.editReply({
        content: "Logi channel successfully set to '" + channel.name + "'",
    });
    return true;
}

export default spsetlogichannel
