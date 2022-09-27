import { Client, ChatInputCommandInteraction, GuildMember, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { getCollections } from '../mongoDB'
import checkPermissions from "../Utils/checkPermissions";
import mongoSanitize from "express-mongo-sanitize";
import findBestMatchItem from "../Utils/findBestMatchItem";

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
            await collections.config.updateOne({ stockpileGroups: mongoSanitize.sanitize(config.stockpileGroups) })
        }
        else {
            const newInsertion: any = {}
            newInsertion[name] = newStockpileObj
            await collections.config.insertOne({ stockpileGroups: mongoSanitize.sanitize(newInsertion) })
        }

        await interaction.editReply({ content: "Created the stockpile group `" + name + "` successfully." })
    }
    else if (interaction.options.getSubcommand() === 'remove') {
        if (name in stockpileGroupsObj) {
            delete stockpileGroupsObj[name]
        }
        else {
            await interaction.editReply({ content: "Stockpile group with name ``" + name + "` was not found" })
            return false
        }


        // stockpileGroups should exist if the stockpile exists in that group
        delete config.stockpileGroups[name]
        await collections.config.updateOne({ stockpileGroups: config.stockpileGroups })

        await interaction.editReply({ content: "Removed the stockpile group `" + name + "` successfully." })
    }
    else if (interaction.options.getSubcommand() === 'addstockpile') {
        const stockpileName = interaction.options.getString("stockpileName")!.toLowerCase()
        if (!stockpileName) {
            await interaction.editReply({
                content: "Missing parameters"
            });
            return false
        }

        if (name in stockpileGroupsObj) {
            if (stockpileName in stockpileGroupsObj[name].stockpiles) {
                await interaction.editReply({ content: "Stockpile `" + stockpileName + "` already exists in the `" + name + "` stockpile group." })
                return false
            }

            stockpileGroupsObj[name].stockpiles[stockpileName] = true
            config.stockpileGroups[name].stockpiles[stockpileName] = true
            await collections.config.updateOne({ stockpileGroups: config.stockpileGroups })

            await interaction.editReply({ content: "Stockpile `" + stockpileName + "` has been added successfully to the `" + name + "` stockpile group." })
        }
        else {
            await interaction.editReply({ content: "Stockpile group with name ``" + name + "` was not found" })
            return false
        }

    }
    else if (interaction.options.getSubcommand() === 'removestockpile') {
        const stockpileName = interaction.options.getString("stockpileName")!.toLowerCase()
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
                await collections.config.updateOne({ stockpileGroups: config.stockpileGroups })

                await interaction.editReply({ content: "Stockpile `" + stockpileName + "` has been removed successfully from the `" + name + "` stockpile group." })
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
        const stockpileName = interaction.options.getString("stockpileName")!.toLowerCase()
        const item = interaction.options.getString("item")!
        const minimum_amount = interaction.options.getInteger("minimum_amount")!
        const maximum_amount = interaction.options.getInteger("maximum_amount")!

        if (name in stockpileGroupsObj) {
            if (stockpileName in stockpileGroupsObj[name].stockpiles) {

                const itemListBoth = NodeCacheObj.get("itemListBoth") as Array<string>
                const lowerToOriginal: any = NodeCacheObj.get("lowerToOriginal")

                const cleanitem = item.replace(/\$/g, "").replace(/\./g, "_").toLowerCase()
                if (!itemListBoth.includes(cleanitem)) {
                    const bestItem = findBestMatchItem(cleanitem)
                    const row = new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('spsettarget==' + bestItem + "==" + minimum_amount + "==" + maximum_amount)
                                .setLabel(lowerToOriginal[bestItem])
                                .setStyle(ButtonStyle.Primary)
                            ,
                            new ButtonBuilder()
                                .setCustomId('spsettarget==' + bestItem + " Crate==" + minimum_amount + "==" + maximum_amount)
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

                    await interaction.editReply({ content: "Stockpile `" + stockpileName + "` has been removed successfully from the `" + name + "` stockpile group." })
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
    }
    else if (interaction.options.getSubcommand() === 'removetarget') {

    }

    return true;
}

export default spgroup
