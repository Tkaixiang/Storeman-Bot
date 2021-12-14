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
    if ("logiMessage" in configDoc) {
        // Delete previous message if it exists
        const newChannelObj = client.channels.cache.get(configDoc.channelId) as TextChannel
        const msg = await newChannelObj.messages.fetch(configDoc.logiMessage)
        if (msg) await msg.delete()
    }
    const finalMsg = await generateMsg(false)
    const newMsg = await channelObj.send(finalMsg)
    await collections.config.updateOne({}, { $set: { logiMessage: newMsg.id, channelId: channel.id } })


    await interaction.reply({
        content: "Logi channel successfully set to '" + channel.name + "'",
        ephemeral: true
    });
    return true;
}

export default spsetlogichannel