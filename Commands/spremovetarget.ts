import { Client, CommandInteraction, GuildMember } from "discord.js";
import { getCollections } from './../mongoDB'
import generateStockpileMsg from "./../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";
import checkPermissions from "../Utils/checkPermissions";
import mongoSanitize from "express-mongo-sanitize"

const spremovetarget = async (interaction: CommandInteraction, client: Client): Promise<boolean> => {
    const item = interaction.options.getString("item")! // Tell typescript to shut up and it is non-null

    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false
    
    if (!item) {
        await interaction.reply({
            content: "Missing parameters",
            ephemeral: true
        });
        return false
    }

    
    const collections = getCollections()
    let updateObj: any = {}
    updateObj[item] = false
    mongoSanitize.sanitize(updateObj, {replaceWith: "_"})
    if ((await collections.targets.updateOne({}, { $unset: updateObj })).modifiedCount === 0) {
        await interaction.reply({
            content: "Item '" + item + " was not found in the target list."
        });
    }

    const newMsg = await generateStockpileMsg(true)
    await updateStockpileMsg(client, newMsg)
    
    await interaction.reply({
        content: "Item '" + item + "' has been removed from the target list."
    });

    return true;
}

export default spremovetarget
