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

    await interaction.reply({ content: 'Working on it', ephemeral: true });
    const collections = process.env.STOCKPILER_MULTI_SERVER === "true" ? getCollections(interaction.guildId) : getCollections()
    const cleanedName = stockpile.replace(/\./g, "").replace(/\$/g, "").toLowerCase()
    const searchQuery = new RegExp(cleanedName, "i")
    if ((await collections.stockpiles.deleteOne({ name: searchQuery })).deletedCount > 0) {
        const configObj = (await collections.config.findOne({}))!
        if ("orderSettings" in configObj) {
            let position = -1
            for (let i = 0; i < configObj.orderSettings.length; i++) {
                if (stockpile.toLowerCase() === cleanedName) {
                    position = i
                    break
                }
            }
            if (position !== -1) {
                configObj.orderSettings.splice(position, 1)
                await collections.config.updateOne({}, { $set: { orderSettings: configObj.orderSettings } })
            }
        }

        if ("prettyName" in configObj) {

            const prettyNameObj: any = NodeCacheObj.get("prettyName")
            let prettyName: any;
            if (process.env.STOCKPILER_MULTI_SERVER === "true") prettyName = prettyNameObj[interaction.guildId!]
            else prettyName = prettyNameObj

            for (const name in prettyName) {
                if (name.toLowerCase() === cleanedName) {
                    delete prettyName[name]
                    break
                }
            }
            await collections.config.updateOne({}, { $set: { prettyName: prettyName } })
        }
        if ("code" in configObj) {
            for (const name in configObj.code) {
                if (name.toLowerCase() === cleanedName) {
                    delete configObj.code[name]
                    break
                }
            }
            await collections.config.updateOne({}, { $set: { code: configObj.code } })
        }

        const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader] = await generateStockpileMsg(true, interaction.guildId)
        await updateStockpileMsg(client, interaction.guildId, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader])

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
