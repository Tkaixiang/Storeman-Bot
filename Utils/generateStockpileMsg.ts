import { MessageActionRow, MessageButton } from 'discord.js';
import { getCollections } from '../mongoDB';



const generateMsg = async (updateMsg: boolean, guildID: string | null): Promise<Array<any>> => {
    const collections = process.env.STOCKPILER_MULTI_SERVER === "true" ? getCollections(guildID) : getCollections()
    const disableTimeNotif: any = NodeCacheObj.get("disableTimeNotif")
    const timeCheckDisabled = process.env.STOCKPILER_MULTI_SERVER === "true" ? disableTimeNotif[guildID!] : disableTimeNotif

    const lowerToOriginal: any = NodeCacheObj.get("lowerToOriginal")
    const prettyNameObj: any = NodeCacheObj.get("prettyName")
    let prettyName: any = {}
    if (process.env.STOCKPILER_MULTI_SERVER === "true") prettyName = prettyNameObj[guildID!]
    else prettyName = prettyNameObj
    let stockpileHeader = "**__Stockpiler Discord Bot Report__** \n_All quantities in **crates**_"
    let locationMappings: any = NodeCacheObj.get("locationMappings")
    let stockpileMsgsHeader = "**__Stockpiles__** \n\n ----------"
    let stockpileMsgs = NodeCacheObj.get("stockpileMsgs") as Array<string | any[]>
    let targetMsgs = NodeCacheObj.get("targetMsgs") as Array<string>
    let code: any = {}
    let stockpileLocations: any = {}
    const refreshAll =   new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('sprefreshall==')
            .setLabel("Refresh All Stockpiles")
            .setStyle('SUCCESS')
    );
 

    if (process.env.STOCKPILER_MULTI_SERVER === "true" || updateMsg || !stockpileMsgs || !targetMsgs) {
        const targets = await collections.targets.findOne({})
        const stockpilesList = await collections.stockpiles.find({}).toArray()
        const configObj = (await collections.config.findOne({}))!

        let stockpiles: Array<any> = []
        if ("orderSettings" in configObj) {
            for (let i = 0; i < configObj.orderSettings.length; i++) {
                for (let x = 0; x < stockpilesList.length; x++) {
                    if (stockpilesList[x].name === configObj.orderSettings[i]) {
                        stockpiles.push(stockpilesList[x])
                        break
                    }
                }
            }
        }
        else stockpiles = stockpilesList

        if ("code" in configObj) code = configObj.code
        if ("stockpileLocations" in configObj) stockpileLocations = configObj.stockpileLocations

        stockpileMsgs = []
        const totals: any = {}
        const itemListCategoryMapping: any = NodeCacheObj.get("itemListCategoryMapping")


        for (let i = 0; i < stockpiles.length; i++) {
            const current = stockpiles[i]
            let currentStockpileMsg = ""
            currentStockpileMsg += `**${prettyName && current.name in prettyName ? prettyName[current.name] : current.name}** (last scan: <t:${Math.floor(current.lastUpdated.getTime() / 1000)}:R>) ${"timeLeft" in current && !timeCheckDisabled ? `[Expiry: ${"upperBound" in current ? `Sometime between: <t:${Math.floor(current.timeLeft.getTime() / 1000)}:R> and <t:${Math.floor(current.upperBound.getTime() / 1000)}:R>]` : `<t:${Math.floor(current.timeLeft.getTime() / 1000)}:R>]`}` : ""} ${prettyName && current.name in prettyName ? "[a.k.a " + current.name + "]" : ""}\n`
            if (current.name in code) currentStockpileMsg += `**Stockpile Code:** \`${code[current.name]}\`\n`
            if (current.name in stockpileLocations) currentStockpileMsg += `**Location:** \`${locationMappings[stockpileLocations[current.name]]}\`\n\n`

            let sortedItems: any = {}

            for (const item in current.items) {

                const currentCat = itemListCategoryMapping[item]
                const currentMsg = current.items[item] + " - `" + lowerToOriginal[item] + "`" + "\n"
                if (currentCat in sortedItems) sortedItems[currentCat].push(currentMsg)
                else sortedItems[currentCat] = [currentMsg]

                if (item in totals) totals[item] += current.items[item]
                else totals[item] = current.items[item]

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

                stockpileMsgs.push(finalMsg)
                currentStockpileMsg = currentStockpileMsg.slice(lastEnd, currentStockpileMsg.length)
            }
            if (timeCheckDisabled) {
                stockpileMsgs.push(currentStockpileMsg)
            }
            else {
                const row = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId('spsettimeleft==' + current.name)
                            .setLabel("Refresh Timer")
                            .setStyle('PRIMARY')
                    );
                const copyOfCurrentMsg = currentStockpileMsg.slice()
                const finalStockpileMsg = [copyOfCurrentMsg, row]
                stockpileMsgs.push(finalStockpileMsg)
            }

        }

        targetMsgs = []
        let targetMsg = "**__Targets__** \n\n"
        if (targets) {
            let sortedTargets: any = {}
            for (const target in targets) {
                if (target !== "_id") {
                    const currentCat = itemListCategoryMapping[target]
                    let icon = "❌"
                    if (totals[target] >= targets[target].min) icon = "✅"
                    else {
                        const percentage = totals[target] / targets[target].min
                        if (percentage >= 0.75) icon = "🟡"
                        else if (percentage >= 0.5) icon = "🟠"
                    }

                    const currentMsg = `${target in totals ? totals[target] : "0"}/${targets[target].min} ${icon} - \`${lowerToOriginal[target]}\` (Max: ${targets[target].max === 0 ? "∞" : targets[target].max}) ${"prodLocation" in targets[target] && typeof targets[target].prodLocation === 'string' ? "[" + targets[target].prodLocation + "]" : ""}\n`

                    if (currentCat in sortedTargets) sortedTargets[currentCat].push(currentMsg)
                    else sortedTargets[currentCat] = [currentMsg]
                }
            }

            for (const category in sortedTargets) {
                targetMsg += "__" + category + "__\n"
                for (let i = 0; i < sortedTargets[category].length; i++) {
                    targetMsg += sortedTargets[category][i]
                }
            }

            while (targetMsg.length > 2000) {

                const sliced = targetMsg.slice(0, 2000)
                const lastEnd = sliced.lastIndexOf("\n")
                const finalMsg = sliced.slice(0, lastEnd)

                targetMsgs.push(finalMsg)
                targetMsg = targetMsg.slice(lastEnd, targetMsg.length)
            }
            targetMsgs.push(targetMsg)
        }
        targetMsg += "\n"

        NodeCacheObj.set("stockpileMsgs", stockpileMsgs)
        NodeCacheObj.set("targetMsgs", targetMsgs)
    }

    return [stockpileHeader, stockpileMsgs, targetMsgs, stockpileMsgsHeader, refreshAll]
}


export default generateMsg
