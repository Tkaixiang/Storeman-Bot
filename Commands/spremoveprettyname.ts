import { Client, CommandInteraction, GuildMember } from "discord.js";
import { getCollections } from '../mongoDB'
import generateStockpileMsg from "../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";
import checkPermissions from "../Utils/checkPermissions";

const spremoveprettyname = async (interaction: CommandInteraction, client: Client): Promise<boolean> => {
    let stockpile = interaction.options.getString("stockpile")! // Tell typescript to shut up and it is non-null

    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false

    if (!stockpile) {
        await interaction.reply({
            content: "Missing parameters",
            ephemeral: true
        });
        return false
    }

    await interaction.reply('Working on it');
    const collections = getCollections()
    const cleanedName = stockpile.replace(/\./g, "").replace(/\$/g, "")
    const stockpileExist = await collections.stockpiles.findOne({ name: cleanedName })
    if (!stockpileExist) await interaction.editReply({ content: "The stockpile with the name `" + stockpile + "` does not exist." })
    else {
        const configObj = (await collections.config.findOne({}))!
        delete configObj.prettyName[cleanedName] 
        await collections.config.updateOne({}, { $set: { prettyName: configObj.prettyName } })
        const prettyName: any = NodeCacheObj.get("prettyName")
        delete prettyName[cleanedName]
        await interaction.editReply({ content: "Removed the pretty name from `" + stockpile + "` successfully." })

        const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, stockpileNames] = await generateStockpileMsg(true)
        await updateStockpileMsg(client, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader], stockpileNames)
    }




    return true;
}

export default spremoveprettyname
