import { Client, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { getCollections } from '../mongoDB'
import checkPermissions from "../Utils/checkPermissions";
import mongoSanitize from "express-mongo-sanitize";

const spgroup = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
    const collections = process.env.STOCKPILER_MULTI_SERVER === "true" ? getCollections(interaction.guildId) : getCollections()

    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false
    await interaction.reply({content: 'Working on it', ephemeral: true});
    const config = await collections.config.findOne({})
    const stockpileGroupsObjInitial: any = NodeCacheObj.get("stockpileGroups")
    const stockpileGroupsObj: any = process.env.STOCKPILER_MULTI_SERVER === "true" ? stockpileGroupsObjInitial[interaction.guildId!] : stockpileGroupsObjInitial

    const name = interaction.options.getString("name")!.toLowerCase()

    if (interaction.options.getSubcommand() === 'create') {
        if (!name) {
            await interaction.editReply({
                content: "Missing parameters"
            });
            return false
        }

        
        if (name in stockpileGroupsObj) {
            await interaction.editReply({content: "Stockpile group with name ˋ" + name + "ˋ already exists."})
            return false
        }

        const newStockpileObj = {stockpiles: {}, targets: {}}
        stockpileGroupsObj[name] = newStockpileObj
    

        if ("stockpileGroups" in config) {
            config.stockpileGroups[name] = newStockpileObj
            await collections.config.updateOne({stockpileGroups: mongoSanitize.sanitize(config.stockpileGroups)})
        }
        else {
            const newInsertion: any = {}
            newInsertion[name] = newStockpileObj
            await collections.config.insertOne({stockpileGroups: mongoSanitize.sanitize(newInsertion)})
        }

        await interaction.editReply({content: "Created the stockpile group ˋ" + name + "ˋ successfully."})
    }
    else if (interaction.options.getSubcommand() === 'remove') {
        if (!name) {
            await interaction.editReply({
                content: "Missing parameters"
            });
            return false
        }

        if (name in stockpileGroupsObj) {
            delete stockpileGroupsObj[name]
        }
        else {
            await interaction.editReply({content: "Stockpile group with name ˋ" + name + "ˋ was not found"})
            return false
        }
            

    // stockpileGroups should exist if the stockpile exists in that group
        delete config.stockpileGroups[name]
        await collections.config.updateOne({stockpileGroups: mongoSanitize.sanitize(config.stockpileGroups)})

        await interaction.editReply({content: "Removed the stockpile group ˋ" + name + "ˋ successfully."})
    }
    else if (interaction.options.getSubcommand() === 'addstockpile') {

    }
    else if (interaction.options.getSubcommand() === 'removestockpile') {

    }
    else if (interaction.options.getSubcommand() === 'addtarget') {

    }
    else if (interaction.options.getSubcommand() === 'removetarget') {

    }

    return true;
}

export default spgroup
