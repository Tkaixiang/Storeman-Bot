import { AutocompleteInteraction, ApplicationCommandOptionChoiceData } from "discord.js";
import { getCollections } from "../mongoDB";


const splocationComplete = async (interaction: AutocompleteInteraction, collections: any) => {
    const focusedValue = interaction.options.getFocused().toLowerCase();


    const locationMappings: any = NodeCacheObj.get("locationMappings")

    const filtered: Array<ApplicationCommandOptionChoiceData> = []
    for (const code in locationMappings) {
        if (locationMappings[code].toLowerCase().indexOf(focusedValue) !== -1) {
            filtered.push({ name: locationMappings[code], value: code })
        }

        if (filtered.length >= 25) break
    }
    await interaction.respond(filtered);
}

const spStockpileComplete = async (interaction: AutocompleteInteraction, collections: any) => {
    const focusedValue = interaction.options.getFocused().toLowerCase();

    const all_stockpiles = await collections.stockpiles.find({}).toArray();

    const filtered: Array<ApplicationCommandOptionChoiceData> = []
    for (let i = 0; i < all_stockpiles.length; i++) {
        if (all_stockpiles[i].name.toLowerCase().indexOf(focusedValue) !== -1) {
            filtered.push({ name: all_stockpiles[i].name, value: all_stockpiles[i].name })
        }

        if (filtered.length >= 25) break
    }
    await interaction.respond(filtered);
}

const spGroupComplete = async (interaction: AutocompleteInteraction, collections: any) => {
    const focusedValue = interaction.options.getFocused().toLowerCase();

    const config = await collections.config.findOne({})
    const filtered: Array<ApplicationCommandOptionChoiceData> = []
    if ("stockpileGroups" in config) {
        for (const group_name in config.stockpileGroups) {
            if (group_name.toLowerCase().indexOf(focusedValue) !== -1) {
                filtered.push({ name: group_name, value: group_name })
            }
            if (filtered.length >= 25) break
        }
    }

    await interaction.respond(filtered);
}

const commands: any = {
    'sploc': { 'location': splocationComplete, 'stockpile': spStockpileComplete },
    'spcode': { 'stockpile': spStockpileComplete },
    'spstockpile': { 'stockpile': spStockpileComplete },
    'spsetorder': { 'stockpile': spStockpileComplete },
    'spstatus': { 'stockpile': spStockpileComplete },
    'spprettyname': { 'stockpile': spStockpileComplete },
    'sprefresh': { 'stockpile': spStockpileComplete },
    'spsettimeleft': { 'stockpile': spStockpileComplete },
    'spsetamount': { 'stockpile': spStockpileComplete },
    'spgroup': { 'name': spGroupComplete, 'stockpile_name': spStockpileComplete }
}

const autoCompleteHandler = async (interaction: AutocompleteInteraction) => {
    try {
        const collections = process.env.STOCKPILER_MULTI_SERVER === "true" ? getCollections(interaction.guildId) : getCollections()

        commands[interaction.commandName][interaction.options.getFocused(true).name](interaction, collections)
    }
    catch (e) {
        console.log("Error occured in autoCompleteHandler")
        console.log(e)
    }

}

export default autoCompleteHandler
