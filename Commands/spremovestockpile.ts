import { Client, CommandInteraction } from "discord.js";
import { getCollections } from './../mongoDB'
import generateStockpileMsg from "./../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";

const spremovestockpile = async (interaction: CommandInteraction, client: Client): Promise<boolean> => {
    const stockpile = interaction.options.getString("stockpile")! // Tell typescript to shut up and it is non-null

    if (!stockpile) {
        await interaction.reply({
            content: "Missing parameters"
        });
        return false
    }
    const collections = getCollections()
    await collections.stockpiles.deleteOne({name: stockpile})

    const newMsg = await generateStockpileMsg(true)
    await updateStockpileMsg(client, newMsg)
    
    await interaction.reply({
        content: "Successfully deleted the stockpile " + stockpile
    });

    return true;
}

export default spremovestockpile