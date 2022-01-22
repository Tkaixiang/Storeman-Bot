import { CommandInteraction, GuildMember } from "discord.js";
import { getCollections } from "../mongoDB";
import checkPermissions from "../Utils/checkPermissions";
import generateStockpileMsg from '../Utils/generateStockpileMsg'

const spstatus = async (interaction: CommandInteraction): Promise<boolean> => {
    let stockpile = interaction.options.getString("stockpile")!
    let filter = interaction.options.getString("filter")!


    if (!(await checkPermissions(interaction, "user", interaction.member as GuildMember))) return false
    await interaction.reply("Working on it...")

    const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, stockpileNames] = await generateStockpileMsg(false)
    if (filter) {
        if (filter === "targets") {
            await interaction.editReply(targetMsg)
        }
    }
    else {
        if (stockpile) {
            const collections = getCollections()
            const configObj = (await collections.config.findOne({}))!

            stockpile = stockpile.replace(/\./g, "").replace(/\$/g, "")

            const stockpiles = await collections.stockpiles.find({}).toArray()
            const itemListCategoryMapping: any = NodeCacheObj.get("itemListCategoryMapping")
            const lowerToOriginal: any = NodeCacheObj.get("lowerToOriginal")

            for (let i = 0; i < stockpiles.length; i++) {
                const current = stockpiles[i]
                const currentName = "prettyName" in configObj && current.name in configObj.prettyName ? configObj.prettyName[current.name] : current.name

                if (currentName === stockpile) {
                    let currentStockpileMsg = ""
                    currentStockpileMsg += `**${currentName}** (last scan <t:${Math.floor(current.lastUpdated.getTime() / 1000)}>) ${"timeLeft" in current ? `[Expiry: <t:${Math.floor(current.timeLeft.getTime() / 1000)}:R>]` : ""}\n`
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

                        await interaction.followUp(finalMsg)
                        currentStockpileMsg = currentStockpileMsg.slice(lastEnd, currentStockpileMsg.length)
                    }
                    await interaction.followUp(currentStockpileMsg)
                    break
                }
            }
        }
        else {
            await interaction.editReply(stockpileHeader);
            await interaction.followUp(targetMsg)
            await interaction.followUp(stockpileMsgsHeader)
            for (let i = 0; i < stockpileMsgs.length; i++) {
                await interaction.followUp(stockpileMsgs[i]);
            }
        }

    }


    return true;
}

export default spstatus