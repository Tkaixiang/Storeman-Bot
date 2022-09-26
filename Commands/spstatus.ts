import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { getCollections } from "../mongoDB";
import checkPermissions from "../Utils/checkPermissions";
import generateStockpileMsg from '../Utils/generateStockpileMsg'

const spstatus = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {
    let stockpile = interaction.options.getString("stockpile")!
    let filter = interaction.options.getString("filter")!


    if (!(await checkPermissions(interaction, "user", interaction.member as GuildMember))) return false
    await interaction.reply({ content: 'Working on it', ephemeral: true });

    const [stockpileHeader, stockpileMsgs, targetMsgs, stockpileMsgsHeader, refreshAll] = await generateStockpileMsg(false, interaction.guildId)
    if (filter) {
        if (filter === "targets") {
            await interaction.editReply(targetMsgs[0])
            for (let i = 1; i < targetMsgs.length; i++) {
                await interaction.followUp({content: targetMsgs[i], ephemeral: true})
            }
           
        }
    }
    else {
        // find one stockpile given a name
        if (stockpile) {
            let found = false
            const collections = process.env.STOCKPILER_MULTI_SERVER === "true" ? getCollections(interaction.guildId) : getCollections()

            stockpile = stockpile.replace(/\./g, "").replace(/\$/g, "")
            const lowerCaseStockpileName = stockpile.toLowerCase()
            let code: any = {}
            let stockpileLocations: any = {}

            const stockpiles = await collections.stockpiles.find({}).toArray()
            const configObj = (await collections.config.findOne({}))!
            const itemListCategoryMapping: any = NodeCacheObj.get("itemListCategoryMapping")
            const lowerToOriginal: any = NodeCacheObj.get("lowerToOriginal")
            const prettyNameObj: any = NodeCacheObj.get("prettyName")
            let locationMappings: any = NodeCacheObj.get("locationMappings")


            if ("code" in configObj) code = configObj.code
            if ("stockpileLocations" in configObj) stockpileLocations = configObj.stockpileLocations

            const disableTimeNotif: any = NodeCacheObj.get("disableTimeNotif")
            const timeCheckDisabled = process.env.STOCKPILER_MULTI_SERVER === "true" ? disableTimeNotif[interaction.guildId!] : disableTimeNotif

            let prettyName: any;
            if (process.env.STOCKPILER_MULTI_SERVER === "true") prettyName = prettyNameObj[interaction.guildId!]
            else prettyName = prettyNameObj

            for (let i = 0; i < stockpiles.length; i++) {
                const current = stockpiles[i]

                if (current.name.toLowerCase() === lowerCaseStockpileName) {
                    found = true
                    let currentStockpileMsg = ""
                    currentStockpileMsg += `**${prettyName && current.name in prettyName ? prettyName[current.name] : current.name}** (last scan: <t:${Math.floor(current.lastUpdated.getTime() / 1000)}:R>) ${"timeLeft" in current && !timeCheckDisabled ? `[Expiry: ${"upperBound" in current ? `Sometime between: <t:${Math.floor(current.timeLeft.getTime() / 1000)}:R> and <t:${Math.floor(current.upperBound.getTime() / 1000)}:R>]` : `<t:${Math.floor(current.timeLeft.getTime() / 1000)}:R>]`}` : ""} ${prettyName && current.name in prettyName ? "[a.k.a " + current.name + "]" : ""}\n`
                    if (current.name in code) currentStockpileMsg += `**Stockpile Code:** \`${code[current.name]}\`\n`
                    if (current.name in stockpileLocations) currentStockpileMsg += `**Location:** \`${locationMappings[stockpileLocations[current.name]]}\`\n\n`

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

                        await interaction.followUp({ content: finalMsg, ephemeral: true })
                        currentStockpileMsg = currentStockpileMsg.slice(lastEnd, currentStockpileMsg.length)
                    }
                    await interaction.followUp({ content: currentStockpileMsg, ephemeral: true })
                    break
                }
            }

            if (!found) {
                await interaction.editReply("Error: The stockpile `" + stockpile + "` was not found.")
            }
        }
        else {
            await interaction.editReply(stockpileHeader);
            await interaction.followUp({ content: stockpileMsgsHeader, ephemeral: true })
            for (let i = 0; i < stockpileMsgs.length; i++) {
                if (typeof stockpileMsgs[i] !== "string") await interaction.followUp({ content: stockpileMsgs[i][0], ephemeral: true });
                else await interaction.followUp({ content: stockpileMsgs[i], ephemeral: true });
            }
            for (let i = 0; i < targetMsgs.length; i++) {
                await interaction.followUp({ content: targetMsgs[i], ephemeral: true });
            }
        }

    }


    return true;
}

export default spstatus