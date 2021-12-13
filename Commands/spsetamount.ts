import { Client, CommandInteraction } from "discord.js";
import generateStockpileMsg from "./../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";
import { getCollections } from './../mongoDB'

const spsetamount = async (interaction: CommandInteraction, client: Client): Promise<boolean> => {
    const item = <string>interaction.options.getString("item") // Tell typescript to shut up cause it's gonna return a string and not null
    const amount = interaction.options.getInteger("amount")
    const stockpileName = interaction.options.getString("stockpile")
    const collections = getCollections()

    if (!amount || !stockpileName || !item) {
        await interaction.reply({
            content: "Missing parameters"
        });
        return false
    }

    const stockpileExist = await collections.stockpiles.findOne({ name: stockpileName })
    if (stockpileExist) {
        // Stockpile exists, but item doesn't
        stockpileExist.items[item] = amount
        await collections.stockpiles.updateOne({ name: stockpileName }, { $set: {items: stockpileExist.items, lastUpdated: new Date()} })
    }
    else {
        // Stockpile doesn't exist
        let itemObject: any = {}
        itemObject[item] = amount

        await collections.stockpiles.insertOne({ name: stockpileName, items: itemObject, lastUpdated: new Date() })
    }

    const newMsg = await generateStockpileMsg(true)
    await updateStockpileMsg(client, newMsg)

    await interaction.reply({
        content: "Item `" + item + "` has been set to `" + amount + "` crates inside the stockpile `" + stockpileName + "`"
    });

    return true;
}

export default spsetamount