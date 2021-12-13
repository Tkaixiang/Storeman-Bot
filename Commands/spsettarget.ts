import { Client, CommandInteraction } from "discord.js";
import { getCollections } from './../mongoDB'
import generateStockpileMsg from "./../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";

const spsettarget = async (interaction: CommandInteraction, client: Client): Promise<boolean> => {
    const item = interaction.options.getString("item")! // Tell typescript to shut up and it is non-null
    const amount = interaction.options.getInteger("amount")

    if (!amount || !item) {
        await interaction.reply({
            content: "Missing parameters"
        });
        return false
    }

    const collections = getCollections()
    let updateObj: any = {}
    updateObj[item] = amount
    if ((await collections.targets.updateOne({}, { $set: updateObj })).modifiedCount === 0) {
        await collections.targets.insertOne(updateObj)
    }

    const newMsg = await generateStockpileMsg(true)
    await updateStockpileMsg(client, newMsg)

    await interaction.reply({
        content: "Item '" + item + "' has been added with a target of " + amount + " crates."
    });

    return true;
}

export default spsettarget