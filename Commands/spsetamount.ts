import { Client, CommandInteraction, GuildMember } from "discord.js";
import generateStockpileMsg from "./../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";
import checkPermissions from "../Utils/checkPermissions";
import { getCollections } from './../mongoDB'
import findBestMatchItem from '../Utils/findBestMatchItem'
import mongoSanitize from "express-mongo-sanitize";

const spsetamount = async (interaction: CommandInteraction, client: Client): Promise<boolean> => {
    let item = <string>interaction.options.getString("item") // Tell typescript to shut up cause it's gonna return a string and not null
    const amount = interaction.options.getInteger("amount")
    const stockpileName = interaction.options.getString("stockpile")
    const collections = getCollections()

    if (!(await checkPermissions(interaction, "user", interaction.member as GuildMember))) return false

    if (!amount || !stockpileName || !item) {
        await interaction.reply({
            content: "Missing parameters",
            ephemeral: true
        });
        return false
    }

    await interaction.reply({content: 'Working on it'});
    const stockpileExist = await collections.stockpiles.findOne({ name: stockpileName })
    const listWithCrates = NodeCacheObj.get("listWithCrates") as Array<string>
    const cleanitem = item.replace(".", "_")
    if (stockpileExist) {
        // Stockpile exists, but item doesn't
        if (listWithCrates.includes(cleanitem)) {
            if (amount > 0) stockpileExist.items[cleanitem] = amount
            else delete stockpileExist.items[cleanitem]
            mongoSanitize.sanitize(stockpileExist.items, {replaceWith: "_"})
            await collections.stockpiles.updateOne({ name: stockpileName.replace(".", "").replace("$", "") }, { $set: { items: stockpileExist.items, lastUpdated: new Date() } })
        }
        else {
            const bestItem = findBestMatchItem(cleanitem).replace("_", ".")
            await interaction.editReply({
                content: `Item '${item}' was not found. Did you mean: '${bestItem}' or '${bestItem + " Crate"}' instead?`
            });
            return false
        }

    }
    else {
        // Stockpile doesn't exist
        let itemObject: any = {}
        if (amount > 0) itemObject[cleanitem] = amount

        mongoSanitize.sanitize(itemObject, {replaceWith: "_"})
        await collections.stockpiles.insertOne({ name: stockpileName.replace(".","").replace("$",""), items: itemObject, lastUpdated: new Date() })
    }

    const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader] = await generateStockpileMsg(true)
        await updateStockpileMsg(client, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader])

    await interaction.editReply({
        content: "Item `" + item + "` has been set to `" + amount + "` crates inside the stockpile `" + stockpileName + "`"
    });

    return true;
}

export default spsetamount
