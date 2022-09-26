import { ChatInputCommandInteraction, GuildMember, Client } from "discord.js";
import { getCollections } from './../mongoDB';
import checkPermissions from "../Utils/checkPermissions";
import generateStockpileMsg from "./../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";


const spsetorder = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
    let stockpile = interaction.options.getString("stockpile")! // Tell typescript to shut up and it is non-null
    let order = interaction.options.getInteger("order")!
    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false
    
    if (!stockpile || !order) {
        await interaction.reply({
            content: "Missing parameters",
            ephemeral: true
        });
        return false
    }

    await interaction.reply({content: "Working on it", ephemeral: true})
    stockpile = stockpile.toLowerCase()

    const collections = process.env.STOCKPILER_MULTI_SERVER === "true" ? getCollections(interaction.guildId) : getCollections()
    const configObj = (await collections.config.findOne({}))!
    let orderSettings: any = []    
    if ("orderSettings" in configObj) {
        orderSettings = configObj.orderSettings
    }
    else {
        const stockpileList = await collections.stockpiles.find({}).toArray()
        for (let i = 0; i < stockpileList.length; i++) {
            orderSettings.push(stockpileList[i].name)
        }
    }

    order -= 1
    if (order >= orderSettings.length) {
        await interaction.editReply({
            content: "Error, your position order is more than the number of stockpiles. You can select a position from 1 to " + orderSettings.length.toString() 
        })
    }
    let position = -1
    for (let i = 0; i < orderSettings.length; i++) {
        if (orderSettings[i].toLowerCase() === stockpile) {
            position = i
            break
        }
    }
    if (position === -1) {
        await interaction.editReply({
            content: "The stockpile '" + stockpile + "' was not found."
        })
        return false;
    }

    // Start inserting
    const temp = orderSettings.splice(position, 1)[0];
    orderSettings.splice(order, 0, temp)

    await collections.config.updateOne({}, {$set: {orderSettings: orderSettings}})
    const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, refreshAll] = await generateStockpileMsg(true, interaction.guildId)
        await updateStockpileMsg(client,interaction.guildId, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, refreshAll])
        
    await interaction.editReply({
        content: "Order of '" + stockpile + "' stockpile changed to number " + (order+1).toString(),
    });

    return true;
}

export default spsetorder
