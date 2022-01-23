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
        try {
            const msg = await channelObj.messages.fetch(configDoc.stockpileHeader)
            await msg.delete()
        }
        catch (e) {
            console.log("Failed to delete stockpileHeader")
        }
        try {
            const msg = await channelObj.messages.fetch(configDoc.stockpileMsgsHeader)
            await msg.delete()
        }
        catch (e) {
            console.log("Failed to delete stockpileHeader")
        }
        for (let i = 0; i < configDoc.stockpileMsgs.length; i++) {
            try {
                const msg = await channelObj.messages.fetch(configDoc.stockpileMsgs[i])

                await msg.delete()
            }
            catch (e) {
                console.log("Failed to delete msg")
            }
        }
        for (let i = 0; i < configDoc.targetMsg.length; i++) {
            try {
                const msg = await channelObj.messages.fetch(configDoc.targetMsg[i])
                await msg.delete()
            }
            catch (e) {
                console.log("Failed to delete a targetMsg")
            }
        }
       

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
