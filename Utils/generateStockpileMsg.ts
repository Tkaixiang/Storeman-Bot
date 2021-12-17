import { getCollections } from '../mongoDB';


const generateMsg = async (updateMsg: boolean): Promise<Array<any>> => {
    const collections = getCollections()
    let stockpileHeader = "**__Stockpiler Discord Bot Report__** \n\n"
    let stockpileMsgs = NodeCacheObj.get("stockpileHeader") as Array<string>
    let targetMsg = NodeCacheObj.get("targetMsg") as string

    if (updateMsg || !stockpileMsgs || !targetMsg) {
        const targets = await collections.targets.findOne({})
        const stockpiles = await collections.stockpiles.find({}).toArray()

        stockpileMsgs = []
        const totals: any = {}

      
        for (let i = 0; i < stockpiles.length; i++) {
            const current = stockpiles[i]
            stockpileMsgs.push("")
            stockpileMsgs[i] += `**${current.name}** (as of <t:${Math.floor(current.lastUpdated.getTime() / 1000)}>)\n`
            for (const item in current.items) {
                stockpileMsgs[i] += item + " - " + current.items[item] + "\n"

                if (item in totals) totals[item] += current.items[item]
                else totals[item] = current.items[item]
                stockpileMsgs[i] += "----------"
                
            }
        }

        targetMsg = "**__Targets__** \n\n"
        for (const target in targets) {
            if (target !== "_id") {
                targetMsg += `${target.replace("_", ".")} - ${target in totals? totals[target] : "0"}/${targets[target]} ${totals[target] >= targets[target] ? "✅" : "❌"}\n`
            }
        }

        NodeCacheObj.set("stockpileMsgs", stockpileMsgs)
        NodeCacheObj.set("targetMsg", targetMsg)
    }

    return [stockpileHeader, stockpileMsgs, targetMsg]
}


export default generateMsg
