import { Client, ChatInputCommandInteraction, GuildMember, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { getCollections } from '../mongoDB'
import checkPermissions from "../Utils/checkPermissions";
import mongoSanitize from "express-mongo-sanitize";
import findBestMatchItem from "../Utils/findBestMatchItem";
import generateStockpileMsg from "../Utils/generateStockpileMsg";
import updateStockpileMsg from "../Utils/updateStockpileMsg";

const spgroup = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
    const collections = process.env.STOCKPILER_MULTI_SERVER === "true" ? getCollections(interaction.guildId) : getCollections()

    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false
    await interaction.reply({ content: 'Working on it', ephemeral: true });
    const config = await collections.config.findOne({})
    const stockpileGroupsObjInitial: any = NodeCacheObj.get("stockpileGroups")
    const stockpileGroupsObj: any = process.env.STOCKPILER_MULTI_SERVER === "true" ? stockpileGroupsObjInitial[interaction.guildId!] : stockpileGroupsObjInitial

    const name = interaction.options.getString("name")!.toLowerCase()
    if (!name) {
        await interaction.editReply({
            content: "Missing parameters"
        });
        return false
    }

    if (interaction.options.getSubcommand() === 'create') {
        if (name in stockpileGroupsObj) {
            await interaction.editReply({ content: "Stockpile group with name `" + name + "` already exists." })
            return false
        }

        const newStockpileObj = { stockpiles: {}, targets: {} }
        stockpileGroupsObj[name] = newStockpileObj


        if ("stockpileGroups" in config) {
            config.stockpileGroups[name] = newStockpileObj
            await collections.config.updateOne({}, { $set: { stockpileGroups: mongoSanitize.sanitize(config.stockpileGroups) } })
        }
        else {
            const newInsertion: any = {}
            newInsertion[name] = newStockpileObj
            await collections.config.updateOne({}, { $set: { stockpileGroups: mongoSanitize.sanitize(newInsertion) } })
        }

        await interaction.editReply({ content: "Created the stockpile group `" + name + "` successfully." })

        const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, refreshAll] = await generateStockpileMsg(true, interaction.guildId)
        await updateStockpileMsg(client, interaction.guildId, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, refreshAll])

    }
    else if (interaction.options.getSubcommand() === 'remove') {
        if (name in stockpileGroupsObj) {
            delete stockpileGroupsObj[name]
        }
        else {
            await interaction.editReply({ content: "Stockpile group with name `" + name + "` was not found" })
            return false
        }


        // stockpileGroups should exist if the stockpile exists in that group
        delete config.stockpileGroups[name]
        await collections.config.updateOne({}, { $set: { stockpileGroups: config.stockpileGroups } })

        await interaction.editReply({ content: "Removed the stockpile group `" + name + "` successfully." })

        const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, refreshAll] = await generateStockpileMsg(true, interaction.guildId)
        await updateStockpileMsg(client, interaction.guildId, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, refreshAll])

    }
    else if (interaction.options.getSubcommand() === 'addstockpile') {
        const stockpileName = interaction.options.getString("stockpile_name")!.toLowerCase().replace(/\./g, "").replace(/\$/g, "")

        if (!stockpileName) {
            await interaction.editReply({
                content: "Missing parameters"
            });
            return false
        }

        console.log(stockpileGroupsObj)
        if (name in stockpileGroupsObj) {
            if (stockpileName in stockpileGroupsObj[name].stockpiles) {
                await interaction.editReply({ content: "Stockpile `" + stockpileName + "` already exists in the `" + name + "` stockpile group." })
                return false
            }

            const searchQuery = new RegExp(`^${stockpileName}$`, "i")
            const stockpileExist = await collections.stockpiles.findOne({ name: searchQuery })

            if (!stockpileExist) {
                await interaction.editReply({ content: "Stockpile `" + stockpileName + "` does not exist" })
                return false
            }

            stockpileGroupsObj[name].stockpiles[stockpileName] = true
            
            config.stockpileGroups[name].stockpiles[stockpileName] = true
            await collections.config.updateOne({}, { $set: { stockpileGroups: config.stockpileGroups } })

            await interaction.editReply({ content: "Stockpile `" + stockpileName + "` has been added successfully to the `" + name + "` stockpile group." })

            const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, refreshAll] = await generateStockpileMsg(true, interaction.guildId)
            await updateStockpileMsg(client, interaction.guildId, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, refreshAll])

        }
        else {
            await interaction.editReply({ content: "Stockpile group with name `" + name + "` was not found" })
            return false
        }

    }
    else if (interaction.options.getSubcommand() === 'removestockpile') {
        const stockpileName = interaction.options.getString("stockpile_name")!.toLowerCase()
        if (!stockpileName) {
            await interaction.editReply({
                content: "Missing parameters"
            });
            return false
        }

        if (name in stockpileGroupsObj) {
            if (stockpileName in stockpileGroupsObj[name].stockpiles) {
                delete stockpileGroupsObj[name].stockpiles[stockpileName]
                delete config.stockpileGroups[name].stockpiles[stockpileName]

                await collections.config.updateOne({}, { $set: { stockpileGroups: config.stockpileGroups } })

                await interaction.editReply({ content: "Stockpile `" + stockpileName + "` has been removed successfully from the `" + name + "` stockpile group." })

                const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, refreshAll] = await generateStockpileMsg(true, interaction.guildId)
                await updateStockpileMsg(client, interaction.guildId, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, refreshAll])
            }
            else {
                await interaction.editReply({ content: "Stockpile `" + stockpileName + "` does not exist in the `" + name + "` stockpile group." })
                return false
            }
        }
        else {
            await interaction.editReply({ content: "Stockpile group with name ``" + name + "` was not found" })
            return false
        }
    }
    else if (interaction.options.getSubcommand() === 'settarget') {
        const item = interaction.options.getString("item")!
        const minimum_amount = interaction.options.getInteger("minimum_amount")!
        let maximum_amount = interaction.options.getInteger("maximum_amount")!
        let production_location = interaction.options.getString("production_location")!
        if (!maximum_amount) maximum_amount = 0

        if (name in stockpileGroupsObj) {

            const itemListBoth = NodeCacheObj.get("itemListBoth") as Array<string>
            const lowerToOriginal: any = NodeCacheObj.get("lowerToOriginal")

            const cleanitem = item.replace(/\$/g, "").replace(/\./g, "_").toLowerCase()
            if (!itemListBoth.includes(cleanitem)) {
                const bestItem = findBestMatchItem(cleanitem)
                const row = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('spgroupsettarget==' + bestItem + "==" + minimum_amount + "==" + maximum_amount + "==" + production_location + "==" + name)
                            .setLabel(lowerToOriginal[bestItem])
                            .setStyle(ButtonStyle.Primary)
                        ,
                        new ButtonBuilder()
                            .setCustomId('spgroupsettarget==' + bestItem + " Crate==" + minimum_amount + "==" + maximum_amount + "==" + production_location + "==" + name)
                            .setLabel(lowerToOriginal[bestItem] + " Crate")
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('cancel')
                            .setLabel('Cancel')
                            .setStyle(ButtonStyle.Danger),
                    );


                await interaction.editReply({
                    components: [row],
                    content: `Item \`${item}\` was not found. Did you mean: \`${lowerToOriginal[bestItem]}\` or \`${lowerToOriginal[bestItem] + " Crate"}\` instead?`
                });


            }
            else {
                let updateObj: any = { min: minimum_amount, max: maximum_amount, prodLocation: production_location }
                mongoSanitize.sanitize(updateObj, { replaceWith: "_" })

                stockpileGroupsObj[name].targets[cleanitem] = updateObj
                config.stockpileGroups[name].targets[cleanitem] = updateObj

                await collections.config.updateOne({}, { $set: { stockpileGroups: config.stockpileGroups } })

                await interaction.editReply({
                    content: `Item \`${lowerToOriginal[cleanitem]}\` has been added with a target of minimum ${minimum_amount} crates and maximum ${maximum_amount !== 0 ? maximum_amount : "unlimited"} crates.`
                });

                const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, refreshAll] = await generateStockpileMsg(true, interaction.guildId)
                await updateStockpileMsg(client, interaction.guildId, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, refreshAll])

            }

        }
        else {
            await interaction.editReply({ content: "Stockpile group with name ``" + name + "` was not found" })
            return false
        }
    }
    else if (interaction.options.getSubcommand() === 'removetarget') {
        const item = interaction.options.getString("item")!
        if (name in stockpileGroupsObj) {
            const itemListBoth = NodeCacheObj.get("itemListBoth") as Array<string>
            const lowerToOriginal: any = NodeCacheObj.get("lowerToOriginal")

            const cleanitem = item.replace(/\$/g, "").replace(/\./g, "_").toLowerCase()
            if (!itemListBoth.includes(cleanitem)) {
                await interaction.editReply({
                    content: "Item `" + lowerToOriginal[cleanitem] + "` is not a target of the " + name + " stockpile group."
                });
                return false
            }
            else {
                delete stockpileGroupsObj[name].targets[cleanitem]
                delete config.stockpileGroups[name].targets[cleanitem]

                await collections.config.updateOne({}, { $set: { stockpileGroups: config.stockpileGroups } })

                await interaction.editReply({
                    content: "Item `" + lowerToOriginal[cleanitem] + "` has been removed from the target list of " + name + " stockpile group."
                });

                const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, refreshAll] = await generateStockpileMsg(true, interaction.guildId)
                await updateStockpileMsg(client, interaction.guildId, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, refreshAll])
            }
        }
        else {
            await interaction.editReply({ content: "Stockpile group with name ``" + name + "` was not found" })
            return false
        }
    }

    return true;
}

export default spgroup
