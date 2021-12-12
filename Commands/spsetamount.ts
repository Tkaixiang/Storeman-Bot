import { CommandInteraction } from "discord.js";
import { getCollections } from './../mongoDB'

const spsetamount = async (interaction: CommandInteraction): Promise<boolean> => {
    const item = <string>interaction.options.getString("item") // Tell typescript to shut up cause it's gonna return a string and not null
    const amount = interaction.options.getInteger("amount")
    const stockpileName = interaction.options.getString("stockpile")
    const collections = getCollections()

    const stockpileExist = await collections.stockpiles.findOne({ name: stockpileName })
    if (stockpileExist) {
        // Stockpile exists, but item doesn't
        stockpileExist.items[item] = amount
        await collections.stockpiles.updateOne({ name: stockpileName }, { $set: stockpileExist.items })
    }
    else {
        // Stockpile doesn't exist
        let itemObject: any = {}
        itemObject[item] = amount

        await collections.stockpiles.insertOne({ name: stockpileName, items: itemObject, lastUpdated: new Date() })
    }
    await interaction.reply({
        content: "Item '" + item + "' has been set to " + amount + " crates inside the stockpile " + stockpileName
    });

    return true;
}

export default spsetamount