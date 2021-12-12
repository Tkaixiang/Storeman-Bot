import { CommandInteraction } from "discord.js";
import { getCollections } from './../mongoDB'

const spremovetarget = async (interaction: CommandInteraction): Promise<boolean> => {
    const item = <string>interaction.options.getString("item") // Tell typescript to shut up cause it's gonna return a string and not null

    const collections = getCollections()
    let updateObj: any = {}
    updateObj[item] = false
    if ((await collections.targets.updateOne({}, { $unset: updateObj })).modifiedCount === 0) {
        await interaction.reply({
            content: "Item '" + item + " was not found in the target list."
        });
    }

    await interaction.reply({
        content: "Item '" + item + "' has been removed from the target list."
    });

    return true;
}

export default spremovetarget