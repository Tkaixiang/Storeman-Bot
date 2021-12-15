import { Client, CommandInteraction, GuildMember } from "discord.js";
import { getCollections } from './../mongoDB'
import generateStockpileMsg from "./../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";
import checkPermissions from "../Utils/checkPermissions";
import findBestMatchItem from "../Utils/findBestMatchItem";

const spsettarget = async (interaction: CommandInteraction, client: Client): Promise<boolean> => {
    const item = interaction.options.getString("item")! // Tell typescript to shut up and it is non-null
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
    if (!listWithCrates.includes(item)) {
        const bestItem = findBestMatchItem(item)
        await interaction.reply({
            content: `Item '${item}' was not found. Did you mean: '${bestItem}' or '${bestItem + " Crate"}' instead?` 
        });
        return false
    }

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