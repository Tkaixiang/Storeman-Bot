import { Client, CommandInteraction, GuildMember } from "discord.js";
import { getCollections } from './../mongoDB'
import generateStockpileMsg from "./../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";
import checkPermissions from "../Utils/checkPermissions";
import mongoSanitize from "express-mongo-sanitize"

const spremovetarget = async (interaction: CommandInteraction, client: Client): Promise<boolean> => {
    let item = interaction.options.getString("item")! // Tell typescript to shut up and it is non-null

    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false
    
    if (!item) {
        await interaction.reply({
            content: "Missing parameters",
            ephemeral: true
        });
        return false
    }

    

    await interaction.reply({content: 'Working on it', ephemeral: true});
    const collections = process.env.STOCKPILER_MULTI_SERVER === "true" ? getCollections(interaction.guildId) : getCollections()
    const cleanItem = item.replace(/\$/g, "").replace(/\./g, "_").toLowerCase()
    let updateObj: any = {}
    updateObj[cleanItem] = false
    mongoSanitize.sanitize(updateObj, {replaceWith: "_"})
    if ((await collections.targets.updateOne({}, { $unset: updateObj })).modifiedCount === 0) {
        await interaction.editReply({
            content: "Item `" + item + "` was not found in the target list."
        });
    }

    const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader] = await generateStockpileMsg(true, interaction.guildId)
        await updateStockpileMsg(client,interaction.guildId, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader])
    
    await interaction.editReply({
        content: "Item `" + item + "` has been removed from the target list."
    });

    return true;
}

export default spremovetarget
