import { Client, CommandInteraction, GuildMember, TextChannel } from "discord.js";
import { getCollections } from '../mongoDB';
import checkPermissions from "../Utils/checkPermissions";

const spremovelogichannel = async (interaction: CommandInteraction, client: Client): Promise<boolean> => {
    const collections = getCollections()
    const configDoc = (await collections.config.findOne({}))!

    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false
    
    if ("channelId" in configDoc) {
        const channelObj = client.channels.cache.get(configDoc.channelId) as TextChannel
        let msg = await channelObj.messages.fetch(configDoc.stockpileHeader)
        if (msg) await msg.delete()
        for (let i = 0; i < configDoc.stockpileMsgs.length; i++) {
            msg = await channelObj.messages.fetch(configDoc.stockpileMsgs)
            if (msg) await msg.delete()
        }
        msg = await channelObj.messages.fetch(configDoc.targetMsg)
        if (msg) await msg.delete()

        await collections.config.updateOne({}, {$unset: {channelId: 0, logiMessage: 0}})
        
        await interaction.reply({
            content: "Logi channel was successfully deleted",
            ephemeral: true
        });
    }
    else {
        await interaction.reply({
            content: "Logi channel was not set. Unable to remove.",
            ephemeral: true
        });
    }
    



   
    return true;
}

export default spremovelogichannel
