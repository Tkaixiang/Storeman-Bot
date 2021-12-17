import { Client, CommandInteraction, GuildMember } from "discord.js";
import { getCollections } from './../mongoDB'
import generateStockpileMsg from "./../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";
import checkPermissions from "../Utils/checkPermissions";

const spremovestockpile = async (interaction: CommandInteraction, client: Client): Promise<boolean> => {
    const stockpile = interaction.options.getString("stockpile")! // Tell typescript to shut up and it is non-null

    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false
    
    if (!stockpile) {
        await interaction.reply({
            content: "Missing parameters",
            ephemeral: true
        });
        return false
    }
    const collections = getCollections()
    if ((await collections.stockpiles.deleteOne({name: stockpile.replace(".", "").replace("$", "")})).deletedCount > 0) {
        const [stockpileHeader, stockpileMsgs, targetMsg] = await generateStockpileMsg(true)
        await updateStockpileMsg(client, [stockpileHeader, stockpileMsgs, targetMsg])
        
        await interaction.reply({
            content: "Successfully deleted the stockpile " + stockpile
        });
    }
    else {
        await interaction.reply({
            content: stockpile + " stockpile does not exist."
        });
    }

    

    return true;
}

export default spremovestockpile
