import { Client, ChatInputCommandInteraction, GuildMember, TextChannel } from "discord.js";
import { getCollections } from './../mongoDB';
import checkPermissions from "../Utils/checkPermissions";
import generateStockpileMsg from "../Utils/generateStockpileMsg";
import updateStockpileMsg from "../Utils/updateStockpileMsg";
import checkTimeNotifs from "../Utils/checkTimeNotifs";


const spdisabletime = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
    const disable = interaction.options.getBoolean("disable")! // Tell typescript to shut up and it is non-null
    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false
    
    const collections = process.env.STOCKPILER_MULTI_SERVER === "true" ? getCollections(interaction.guildId) : getCollections()
    if (typeof disable !== "boolean") {
        await interaction.editReply({
            content: "Missing parameters"
        });
        return false
    }

    await collections.config.updateOne({}, { $set: { disableTimeNotif: disable } })

    const disableTimeNotif: any = NodeCacheObj.get("disableTimeNotif")
    if (process.env.STOCKPILER_MULTI_SERVER === "true") disableTimeNotif[interaction.guildId!] = disable
    else NodeCacheObj.set("disableTimeNotif", disable)

    if (disable) {
        const configObj = (await collections.config.findOne({}))!
        if ("channelId" in configObj && "warningMsgId" in configObj) {
            try {
                const channelObj = client.channels.cache.get(configObj.channelId) as TextChannel
                const stockpileMsg = await channelObj.messages.fetch(configObj.warningMsgId)
                if (stockpileMsg) await stockpileMsg.delete()
            }
            catch (e) {
                console.log(e)
                console.log("Failed to delete warning msg")
            }
        }
    }

    await interaction.editReply({
        content: `Successfully ${disable ? "disabled" : "enabled"} the time-checking feature of Storeman Bot`,
    });

    const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, refreshAll] = await generateStockpileMsg(true, interaction.guildId)
    await updateStockpileMsg(interaction.client,interaction.guildId, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, refreshAll])
    if (!disable) checkTimeNotifs(client, true, false, interaction.guildId!)

    return true;
}

export default spdisabletime
