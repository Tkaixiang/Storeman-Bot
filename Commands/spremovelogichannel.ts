import { Client, CommandInteraction, GuildMember, TextChannel } from "discord.js";
import { getCollections } from '../mongoDB';
import checkPermissions from "../Utils/checkPermissions";

const spremovelogichannel = async (interaction: CommandInteraction, client: Client): Promise<boolean> => {
    const collections = getCollections()
    const configDoc = (await collections.config.findOne({}))!

    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false

    await interaction.reply({ content: 'Working on it', ephemeral: true });
    if ("channelId" in configDoc) {
        const channelObj = client.channels.cache.get(configDoc.channelId) as TextChannel
        let msg = await channelObj.messages.fetch(configDoc.stockpileHeader)
        if (msg) await msg.delete()
        msg = await channelObj.messages.fetch(configDoc.stockpileMsgsHeader)
        if (msg) await msg.delete()
        else console.log("Failed to find stockpileHeader, skipping")
        for (let i = 0; i < configDoc.stockpileMsgs.length; i++) {
            msg = await channelObj.messages.fetch(configDoc.stockpileMsgs[i])
            if (msg) await msg.delete()
            else console.log("Failed to find stockpileMsg")
        }
        msg = await channelObj.messages.fetch(configDoc.targetMsg)
        if (msg) await msg.delete()
        else console.log("Failed to find targetMsg")

        await collections.config.updateOne({}, { $unset: { channelId: 0, stockpileHeader: 0, stockpileMsgs: 0, targetMsg: 0, stockpileMsgsHeader: 0 } })

        await interaction.editReply({
            content: "Logi channel was successfully deleted",
        });
    }
    else {
        await interaction.editReply({
            content: "Logi channel was not set. Unable to remove."
        });
    }





    return true;
}

export default spremovelogichannel
