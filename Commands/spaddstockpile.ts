import { Client, CommandInteraction, GuildMember, TextChannel } from "discord.js";
import { getCollections } from '../mongoDB'
import generateStockpileMsg from "../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";
import checkPermissions from "../Utils/checkPermissions";
import mongoSanitize from "express-mongo-sanitize";

const spaddstockpile = async (interaction: CommandInteraction, client: Client): Promise<boolean> => {
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
    const stockpileExist = await collections.stockpiles.findOne({ name: stockpile.replace(/\./g, "").replace(/\$/g, "") })
    if (stockpileExist) {
        await interaction.editReply({ content: "The stockpile with the name `" + stockpile + "` already exists." })
    }
    else {
        let insertObj: any = {
            name: stockpile, items: {}, lastUpdated: new Date()
        }
        mongoSanitize.sanitize(insertObj, { replaceWith: "_" })
        await collections.stockpiles.insertOne(insertObj)
        await interaction.editReply({ content: "Added the stockpile `" + stockpile + "` successfully." })

        const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader] = await generateStockpileMsg(true)
        await updateStockpileMsg(client, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader])
    }




    return true;
}

export default spaddstockpile
