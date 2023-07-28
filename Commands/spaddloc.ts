import { Client, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { getCollections } from '../mongoDB'
import generateStockpileMsg from "../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";
import checkPermissions from "../Utils/checkPermissions";

const spaddloc = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
    let stockpile = interaction.options.getString("stockpile")! // Tell typescript to shut up and it is non-null
    let location = interaction.options.getString("location")! // Tell typescript to shut up and it is non-null

    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false

    if (!stockpile || !location) {
        await interaction.editReply({
            content: "Missing parameters"
        });
        return false
    }

    
    const collections = process.env.STOCKPILER_MULTI_SERVER === "true" ? getCollections(interaction.guildId) : getCollections()
    const locationMappings: any = NodeCacheObj.get("locationMappings")
    const cleanedName = stockpile.replace(/\./g, "").replace(/\$/g, "")
    const searchQuery = new RegExp(`^${cleanedName}$`, "i")

    const cleanedLocation = location.replace(/\./g, "").replace(/\$/g, "").toLowerCase()
    if (!(cleanedLocation in locationMappings)) {
        await interaction.editReply({ content: "The location with the code `" + cleanedLocation + "` does not exist." })
        return false
    }

    const stockpileExist = await collections.stockpiles.findOne({ name: searchQuery })
    if (!stockpileExist) await interaction.editReply({ content: "The stockpile with the name `" + stockpile + "` does not exist." })
    else {
        const configObj = (await collections.config.findOne({}))!
        if ("stockpileLocations" in configObj) {
            configObj.stockpileLocations[stockpileExist.name] = cleanedLocation
            await collections.config.updateOne({}, { $set: { stockpileLocations: configObj.stockpileLocations } })
        }
        else {
            const locationObj: any = {}
            locationObj[stockpileExist.name] = cleanedLocation
            await collections.config.updateOne({}, { $set: { stockpileLocations: locationObj } })
        }
        await interaction.editReply({ content: "Added the location `" + locationMappings[cleanedLocation] + "` to stockpile `" + stockpileExist.name + "` successfully." })

        const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, refreshAll] = await generateStockpileMsg(true, interaction.guildId)
        await updateStockpileMsg(client, interaction.guildId, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, refreshAll])
    }




    return true;
}

export default spaddloc
