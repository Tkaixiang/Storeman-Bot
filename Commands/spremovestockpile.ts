import { Client, CommandInteraction, GuildMember, TextChannel } from "discord.js";
import { getCollections } from './../mongoDB'
import generateStockpileMsg from "./../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";
import checkPermissions from "../Utils/checkPermissions";

const spremovestockpile = async (interaction: CommandInteraction, client: Client): Promise<boolean> => {
    let stockpile = interaction.options.getString("stockpile")! // Tell typescript to shut up and it is non-null

    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false

    if (!stockpile) {
        await interaction.reply({
            content: "Missing parameters",
            ephemeral: true
        });
        return false
    }

    await interaction.reply({content: 'Working on it', ephemeral: true});
    const collections = getCollections()
    const searchQuery = new RegExp(stockpile.replace(/\./g, "").replace(/\$/g, ""), "i")
    if ((await collections.stockpiles.deleteOne({ name: searchQuery })).deletedCount > 0) {
        const configObj = (await collections.config.findOne({}))!
        if ("orderSettings" in configObj) {
            const position = configObj.orderSettings.indexOf(stockpile)
            if (position !== -1) {
                configObj.orderSettings.splice(position, 1)
                await collections.config.updateOne({}, { $set: { orderSettings: configObj.orderSettings } })
            }
        }
        
        const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, stockpileNames] = await generateStockpileMsg(true)
        await updateStockpileMsg(client, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader], stockpileNames)

        const stockpileTime: any = NodeCacheObj.get("stockpileTimes")
        delete stockpileTime[stockpile]
        
        await interaction.editReply({
            content: "Successfully deleted the stockpile " + stockpile
        });
    }
    else {
        await interaction.editReply({
            content: stockpile + " stockpile does not exist."
        });
    }



    return true;
}

export default spremovestockpile
