import { CommandInteraction, GuildMember } from "discord.js";
import { getCollections } from "../mongoDB";
import checkPermissions from "../Utils/checkPermissions";
import generateStockpileMsg from '../Utils/generateStockpileMsg'

const spstatus = async (interaction: CommandInteraction): Promise<boolean> => {
    let stockpile = interaction.options.getString("stockpile")!
    let filter = interaction.options.getString("filter")!


    if (!(await checkPermissions(interaction, "user", interaction.member as GuildMember))) return false
    await interaction.reply({ content: 'Working on it', ephemeral: true });

    const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader] = await generateStockpileMsg(false, interaction.guildId)
    if (filter) {
        if (filter === "targets") {
            await interaction.editReply(targetMsg)
        }
    }
    else {
        if (stockpile) {
            const collections = process.env.STOCKPILER_MULTI_SERVER === "true" ? getCollections(interaction.guildId) : getCollections()

            stockpile = stockpile.replace(/\./g, "").replace(/\$/g, "")

            const stockpiles = await collections.stockpiles.find({}).toArray()
            const itemListCategoryMapping: any = NodeCacheObj.get("itemListCategoryMapping")
            const lowerToOriginal: any = NodeCacheObj.get("lowerToOriginal")
            const prettyNameObj: any = NodeCacheObj.get("prettyName")
            let prettyName: any;
            if (process.env.STOCKPILER_MULTI_SERVER === "true") prettyName = prettyNameObj[interaction.guildId!]
            else prettyName = prettyNameObj

            for (let i = 0; i < stockpiles.length; i++) {
                const current = stockpiles[i]

                if (current.name === stockpile) {
                    let currentStockpileMsg = ""
                    currentStockpileMsg += `**${current.name in prettyName ? prettyName[current.name] : current.name}** (last scan: <t:${Math.floor(current.lastUpdated.getTime() / 1000)}:R>) ${"timeLeft" in current ? `[Expiry: <t:${Math.floor(current.timeLeft.getTime() / 1000)}:R>]` : ""} ${current.name in prettyName ? "[a.k.a" + current.name + "]" : ""}\n`
                    let sortedItems: any = {}
                    for (const item in current.items) {

                        const currentCat = itemListCategoryMapping[item]
                        const currentMsg = "`" + lowerToOriginal[item] + "` - " + current.items[item] + "\n"
                        if (currentCat in sortedItems) sortedItems[currentCat].push(currentMsg)
                        else sortedItems[currentCat] = [currentMsg]

                    }
                    for (const category in sortedItems) {
                        currentStockpileMsg += "__" + category + "__\n"
                        for (let i = 0; i < sortedItems[category].length; i++) {
                            currentStockpileMsg += sortedItems[category][i]
                        }
                    }
                    currentStockpileMsg += "----------"
                    while (currentStockpileMsg.length > 2000) {

                        const sliced = currentStockpileMsg.slice(0, 2000)
                        const lastEnd = sliced.lastIndexOf("\n")
                        const finalMsg = sliced.slice(0, lastEnd)

                        await interaction.followUp({content: finalMsg, ephemeral: true})
                        currentStockpileMsg = currentStockpileMsg.slice(lastEnd, currentStockpileMsg.length)
                    }
                    await interaction.followUp({content: currentStockpileMsg, ephemeral: true})
                    break
                }
            }
        }
        else {
            await interaction.editReply(stockpileHeader);
            await interaction.followUp({content: stockpileMsgsHeader, ephemeral: true})
            for (let i = 0; i < stockpileMsgs.length; i++) {
                if (typeof stockpileMsgs[i] !== "string") await interaction.followUp({content: stockpileMsgs[i][0], ephemeral: true});
                else await interaction.followUp({content: stockpileMsgs[i], ephemeral: true});
            }
            for (let i = 0; i < targetMsg.length; i++) {
                await interaction.followUp({content: targetMsg[i], ephemeral: true});
            }
        }

    }


    return true;
}

export default spstatus