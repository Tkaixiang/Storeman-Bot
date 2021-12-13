import { CommandInteraction } from "discord.js";
import { getCollections } from './../mongoDB'

interface itemToNameType {
    [key: string]: string
}
const itemToName: itemToNameType = {"bmats": "Basic Materials", "hemats": "Heavy Explosive Materials", "emats": "Explosive Materials"}

const spstatus = async (interaction: CommandInteraction): Promise<boolean> => {
    const collections = getCollections()

    const targets = await collections.targets.findOne({})
    const stockpiles = await collections.stockpiles.find({}).toArray()

    const totals: any = {}

    let stockpileMsg = "**__Stockpiles__** \n\n"
    for (let i = 0; i < stockpiles.length; i++) {
        const current = stockpiles[i]
        stockpileMsg += `**${current.name}** (as of <t:${Math.floor(current.lastUpdated.getTime() / 1000)}>)\n`
        for (const item in current.items) {
            stockpileMsg += itemToName[item] + " - " + current.items[item]
            
            if (item in totals) totals[item] += current.items[item]
            else totals[item] = current.items[item]
        }
        stockpileMsg += "\n-----"
    }

    let targetMsg = "**__Targets__** \n\n"
    for (const target in targets) {
        if (target !== "_id") {
            targetMsg += `${itemToName[target]} - ${totals[target]}/${targets[target]} ${totals[target] >= targets[target] ? "✅" : "❌"}\n`
        } 
    }

    await interaction.reply({
        content: `**__Current Stockpile Information__** 
_Note that all amounts are in **crates**_

${targetMsg}


${stockpileMsg}
        `
    });

    return true;
}

export default spstatus