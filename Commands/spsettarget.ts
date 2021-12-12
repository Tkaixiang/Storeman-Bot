import { CommandInteraction } from "discord.js";
import { getCollections } from './../mongoDB'

const spsettarget = async (interaction: CommandInteraction): Promise<boolean> => {
    const item = <string>interaction.options.getString("item") // Tell typescript to shut up cause it's gonna return a string and not null
    const amount = interaction.options.getInteger("amount")

    const collections = getCollections()
    let updateObj: any = {}
    updateObj[item] = amount
    if ((await collections.targets.updateOne({}, { $set: updateObj })).modifiedCount === 0) {
        await collections.targets.insertOne(updateObj)
    }

    await interaction.reply({
        content: "Item '" + item + "' has been added with a target of " + amount + " crates."
    });

    return true;
}

export default spsettarget