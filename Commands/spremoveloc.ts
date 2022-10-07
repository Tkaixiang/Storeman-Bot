import { Client, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { getCollections } from '../mongoDB'
import generateStockpileMsg from "../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";
import checkPermissions from "../Utils/checkPermissions";

const spremoveloc = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
    let stockpile = interaction.options.getString("stockpile")! // Tell typescript to shut up and it is non-null

    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false

    if (!stockpile) {
        await interaction.editReply({
            content: "Missing parameters"
        });
        return false
    }

    
    const collections = process.env.STOCKPILER_MULTI_SERVER === "true" ? getCollections(interaction.guildId) : getCollections()
    const cleanedName = stockpile.replace(/\./g, "").replace(/\$/g, "").toLowerCase()
    const searchQuery = new RegExp(`^${cleanedName}$`, "i")
    const stockpileExist = await collections.stockpiles.findOne({ name: searchQuery })
    if (!stockpileExist) await interaction.editReply({ content: "The stockpile with the name `" + stockpile + "` does not exist." })
    else {
        const configObj = (await collections.config.findOne({}))!
        if ("stockpileLocations" in configObj) {
            delete configObj.stockpileLocations[stockpileExist.name]
            await collections.config.updateOne({}, { $set: { stockpileLocations: configObj.stockpileLocations } })
            await interaction.editReply({ content: "Removed the location from `" + stockpileExist.name + "` successfully." })
        }
        else {
            await interaction.editReply("Error: No location information exists")
        }

        const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, refreshAll] = await generateStockpileMsg(true, interaction.guildId)
        await updateStockpileMsg(client,interaction.guildId, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, refreshAll])
    }




    return true;
}

export default spremoveloc
