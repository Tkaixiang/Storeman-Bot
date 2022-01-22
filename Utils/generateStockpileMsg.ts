import { getCollections } from '../mongoDB';



const generateMsg = async (updateMsg: boolean): Promise<Array<any>> => {
    const collections = getCollections()
    const lowerToOriginal: any = NodeCacheObj.get("lowerToOriginal")
    let stockpileHeader = "**__Stockpiler Discord Bot Report__** \n_All quantities in **crates**_"
    let stockpileMsgsHeader = "**__Stockpiles__** \n\n ----------"
    let stockpileMsgs = NodeCacheObj.get("stockpileHeader") as Array<string>
    let targetMsg = NodeCacheObj.get("targetMsg") as string
    let stockpileNames: String[] = []

    if (updateMsg || !stockpileMsgs || !targetMsg) {
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

        stockpileMsgs = []
        const totals: any = {}
        const itemListCategoryMapping: any = NodeCacheObj.get("itemListCategoryMapping")


        for (let i = 0; i < stockpiles.length; i++) {
            const current = stockpiles[i]
            let currentStockpileMsg = ""
            currentStockpileMsg += `**${"prettyName" in configObj && current.name in configObj.prettyName ? configObj.prettyName[current.name] : current.name}** (last scan <t:${Math.floor(current.lastUpdated.getTime() / 1000)}>) ${"timeLeft" in current ? `[Expiry: <t:${Math.floor(current.timeLeft.getTime() / 1000)}:R>]` : ""}\n`
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
            stockpileMsgs.push(currentStockpileMsg)

            stockpileNames.push(current.name)
        }

        targetMsg = "**__Targets__** \n\n"
        if (targets) {
            let sortedTargets: any = {}
            for (const target in targets) {
                if (target !== "_id") {
                    const currentCat = itemListCategoryMapping[target]
                    const currentMsg = `${target in totals ? totals[target] : "0"}/${targets[target].min} ${totals[target] >= targets[target].min ? "✅" : "❌"} - \`${lowerToOriginal[target]}\` (Max: ${targets[target].max}) ${"prodLocation" in targets[target] && typeof targets[target].prodLocation === 'string' ? "[" + targets[target].prodLocation + "]" : ""}\n`
                
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
        }
        targetMsg += "\n"

        NodeCacheObj.set("stockpileMsgs", stockpileMsgs)
        NodeCacheObj.set("targetMsg", targetMsg)
    }

    return [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, stockpileNames]
}


export default generateMsg
