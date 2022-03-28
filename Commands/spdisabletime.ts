import { Client, CommandInteraction, GuildMember } from "discord.js";
import { getCollections } from './../mongoDB';
import checkPermissions from "../Utils/checkPermissions";
import generateStockpileMsg from "../Utils/generateStockpileMsg";
import updateStockpileMsg from "../Utils/updateStockpileMsg";
import checkTimeNotifs from "../Utils/checkTimeNotifs";


const spdisabletime = async (interaction: CommandInteraction, client: Client): Promise<boolean> => {
    const disable = interaction.options.getBoolean("disable")! // Tell typescript to shut up and it is non-null
    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false
    
    const collections = process.env.STOCKPILER_MULTI_SERVER === "true" ? getCollections(interaction.guildId) : getCollections()
    if (typeof disable !== "boolean") {
        await interaction.reply({
            content: "Missing parameters",
            ephemeral: true
        });
        return false
    }

    await collections.config.updateOne({}, { $set: { disableTimeNotif: disable } })

    const disableTimeNotif: any = NodeCacheObj.get("disableTimeNotif")
    if (process.env.STOCKPILER_MULTI_SERVER === "true") disableTimeNotif[interaction.guildId!] = disable
    else NodeCacheObj.set("disableTimeNotif", disable)

    await interaction.reply({
        content: `Successfully ${disable ? "disabled" : "enabled"} the time-checking feature of Storeman Bot`,
        ephemeral: true
    });

    const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader] = await generateStockpileMsg(true, interaction.guildId)
    await updateStockpileMsg(interaction.client,interaction.guildId, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader])
    if (!disable) checkTimeNotifs(client, true, false, interaction.guildId!)

    return true;
}

export default spdisabletime
