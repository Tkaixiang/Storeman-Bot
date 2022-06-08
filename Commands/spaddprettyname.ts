import { Client, CommandInteraction, GuildMember } from "discord.js";
import { getCollections } from '../mongoDB'
import generateStockpileMsg from "../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";
import checkPermissions from "../Utils/checkPermissions";

const spaddprettyname = async (interaction: CommandInteraction, client: Client): Promise<boolean> => {
    let stockpile = interaction.options.getString("stockpile")! // Tell typescript to shut up and it is non-null
    let prettyName = interaction.options.getString("pretty_name")! // Tell typescript to shut up and it is non-null

    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false

    if (!stockpile || !prettyName) {
        await interaction.reply({
            content: "Missing parameters",
            ephemeral: true
        });
        return false
    }

    await interaction.reply({content: 'Working on it', ephemeral: true});
    const collections = process.env.STOCKPILER_MULTI_SERVER === "true" ? getCollections(interaction.guildId) : getCollections()
    const cleanedName = stockpile.replace(/\./g, "").replace(/\$/g, "")
    const searchQuery = new RegExp(`^${cleanedName}$`, "i")
    const cleanedPrettyName = prettyName.replace(/\./g, "").replace(/\$/g, "")
    const stockpileExist = await collections.stockpiles.findOne({ name: searchQuery })
    if (!stockpileExist) await interaction.editReply({ content: "The stockpile with the name `" + stockpile + "` does not exist." })
    else {
        const configObj = (await collections.config.findOne({}))!
        if ("prettyName" in configObj) {
            configObj.prettyName[stockpileExist.name] = cleanedPrettyName
            await collections.config.updateOne({}, { $set: { prettyName: configObj.prettyName } })
        }
        else {
            const prettyNameObj: any = {}
            prettyNameObj[stockpileExist.name] = cleanedPrettyName
            await collections.config.updateOne({}, { $set: { prettyName: prettyNameObj } })
        }
        const prettyName: any = NodeCacheObj.get("prettyName")
        if (process.env.STOCKPILER_MULTI_SERVER === "true") prettyName[interaction.guildId!][stockpileExist.name] = cleanedPrettyName
        else prettyName[stockpileExist.name] = cleanedPrettyName
        await interaction.editReply({ content: "Added the pretty name `" + cleanedPrettyName + "` to stockpile `" + stockpileExist.name + "` successfully." })

        const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader] = await generateStockpileMsg(true, interaction.guildId)
        await updateStockpileMsg(client,interaction.guildId, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader])
    }




    return true;
}

export default spaddprettyname
