import { Client, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { getCollections } from '../mongoDB'
import generateStockpileMsg from "../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";
import checkPermissions from "../Utils/checkPermissions";

const spremoveprettyname = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
    let stockpile = interaction.options.getString("stockpile")! // Tell typescript to shut up and it is non-null

    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false

    if (!stockpile) {
        await interaction.editReply({
            content: "Missing parameters"
        });
        return false
    }

    
    const collections = process.env.STOCKPILER_MULTI_SERVER === "true" ? getCollections(interaction.guildId) : getCollections()
    const cleanedName = stockpile.replace(/\./g, "").replace(/\$/g, "")
    const searchQuery = new RegExp(`^${cleanedName}$`, "i")
    const stockpileExist = await collections.stockpiles.findOne({ name: searchQuery })
    if (!stockpileExist) await interaction.editReply({ content: "The stockpile with the name `" + stockpile + "` does not exist." })
    else {
        const configObj = (await collections.config.findOne({}))!
        if ('prettyName' in configObj) {
            delete configObj.prettyName[stockpileExist.name]
            await collections.config.updateOne({}, { $set: { prettyName: configObj.prettyName } })
            const prettyName: any = NodeCacheObj.get("prettyName")
            if (process.env.STOCKPILER_MULTI_SERVER === "true") delete prettyName[interaction.guildId!][stockpileExist.name]
            else delete prettyName[stockpileExist.name]

            await interaction.editReply({ content: "Removed the pretty name from `" + stockpileExist.name + "` successfully." })

            const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, refreshAll] = await generateStockpileMsg(true, interaction.guildId)
            await updateStockpileMsg(client, interaction.guildId, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, refreshAll])

        }
        else {
            await interaction.editReply("Error: there are no pretty names")
        }
    }




    return true;
}

export default spremoveprettyname
