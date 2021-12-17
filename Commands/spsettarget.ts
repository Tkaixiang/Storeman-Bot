import { Client, CommandInteraction, GuildMember } from "discord.js";
import { getCollections } from './../mongoDB'
import generateStockpileMsg from "./../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";
import checkPermissions from "../Utils/checkPermissions";
import findBestMatchItem from "../Utils/findBestMatchItem";
import mongoSanitize from "express-mongo-sanitize";

const spsettarget = async (interaction: CommandInteraction, client: Client): Promise<boolean> => {
    let item = interaction.options.getString("item")! // Tell typescript to shut up and it is non-null
    const amount = interaction.options.getInteger("amount")

    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false
    
    if (!amount || !item) {
        await interaction.reply({
            content: "Missing parameters",
            ephemeral: true
        });
        return false
    }

    const collections = getCollections()
    const listWithCrates = NodeCacheObj.get("listWithCrates") as Array<string>

    const cleanitem = item.replace(".", "_")
    if (!listWithCrates.includes(cleanitem)) {
        const bestItem = findBestMatchItem(cleanitem).replace("_", ".")
        await interaction.reply({
            content: `Item '${item}' was not found. Did you mean: '${bestItem}' or '${bestItem + " Crate"}' instead?` 
        });
        return false
    }

    let updateObj: any = {}
    updateObj[cleanitem] = amount
    mongoSanitize.sanitize(updateObj, {replaceWith: "_"})
    if ((await collections.targets.updateOne({}, { $set: updateObj })).modifiedCount === 0) {
        await collections.targets.insertOne(updateObj)
    }

    const [stockpileHeader, stockpileMsgs, targetMsg] = await generateStockpileMsg(true)
        await updateStockpileMsg(client, [stockpileHeader, stockpileMsgs, targetMsg])

    await interaction.reply({
        content: "Item '" + item + "' has been added with a target of " + amount + " crates."
    });

    return true;
}

export default spsettarget
