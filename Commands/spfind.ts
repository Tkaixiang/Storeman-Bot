import { CommandInteraction, GuildMember, MessageActionRow, MessageButton } from "discord.js";
import { getCollections } from "../mongoDB";
import checkPermissions from "../Utils/checkPermissions";
import findBestMatchItem from "../Utils/findBestMatchItem";

const spfind = async (interaction: CommandInteraction): Promise<boolean> => {
    const item = interaction.options.getString("item")!

    if (!(await checkPermissions(interaction, "user", interaction.member as GuildMember))) return false

    await interaction.reply({
        content: "Working on it...",
        ephemeral: true
    });
    const itemListBoth = NodeCacheObj.get("itemListBoth") as Array<string>
    const lowerToOriginal: any = NodeCacheObj.get("lowerToOriginal")
    const locationMappings: any = NodeCacheObj.get("locationMappings")
    const collections = getCollections()

    const cleanitem = item.replace(/\$/g, "").replace(/\./g, "").toLowerCase()

    if (itemListBoth.includes(cleanitem)) {
        let msg = "Stockpiles in which `" + lowerToOriginal[cleanitem] + "` was found in: \n\n"

        const stockpiles = await collections.stockpiles.find({}).toArray()
        const configObj = (await collections.config.findOne({}))!
        let stockpileLocations: any = {}

        if ("stockpileLocations" in configObj) stockpileLocations = configObj.stockpileLocations

        for (let i = 0; i < stockpiles.length; i++) {
            const current = stockpiles[i]
            if (cleanitem in current.items) {
                msg += `**__${current.name}__**${current.name in stockpileLocations ? " (Location: " + locationMappings[stockpileLocations[current.name]] + ")" : ""}:\n`
                msg += current.items[cleanitem] + " - " + lowerToOriginal[cleanitem] + "\n"

                if (cleanitem.indexOf("crate") !== -1) {
                    // Since the item the user is searching for is a crated item, search for its non crated version as well 

                    const nonCratedItem = cleanitem.replace(" crate", "")
                    if (nonCratedItem in current.items) msg += current.items[nonCratedItem] + " - `" + lowerToOriginal[nonCratedItem] + "`\n"
                }
                else {
                   
                    // Since the item the user is searching for is a non-crated item, search for its crated version as well
                    const cratedItem = cleanitem + " crate"
                    if (cratedItem in current.items) msg += current.items[cratedItem] + " - `" + lowerToOriginal[cratedItem] + "`\n"
                }
            }
            else {
                // Item is not inside, try finding the crated/non-crated version of that item
                if (cleanitem.indexOf("crate") !== -1) {
                    // Since the item the user is searching for is a crated item, search for its non crated version as well 
                    const nonCratedItem = cleanitem.replace(" crate", "")
                    if (nonCratedItem in current.items) {
                        msg += `**__${current.name}__**${current.name in stockpileLocations ? " (Location: " + locationMappings[stockpileLocations[current.name]] + ")" : ""}:\n`
                        msg += current.items[nonCratedItem] + " - `" + lowerToOriginal[nonCratedItem] + "`\n"
                    }
                }
                else {
                    // Since the item the user is searching for is a non-crated item, search for its crated version as well
                    const cratedItem = cleanitem + " crate"
                    if (cratedItem in current.items) {
                        msg += `**__${current.name}__**${current.name in stockpileLocations ? " (Location: " + locationMappings[stockpileLocations[current.name]] + ")" : ""}:\n`
                        msg += current.items[cratedItem] + " - `" + lowerToOriginal[cratedItem] + "`\n"
                    }
                }
            }
        }

        while (msg.length > 0) {
            if (msg.length > 2000) {
                const sliced = msg.slice(0, 2000)
                const lastEnd = sliced.lastIndexOf("\n")
                const finalMsg = sliced.slice(0, lastEnd)

                await interaction.followUp({
                    content: finalMsg,
                    ephemeral: true
                });
                msg = msg.slice(lastEnd, msg.length)
            }
            else {
                await interaction.followUp({
                    content: msg,
                    ephemeral: true
                });
                msg = ""
            }
        }
    }
    else {
        const bestItem = findBestMatchItem(cleanitem).replace(/\_/g, ".")
        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('spfind==' + bestItem)
                    .setLabel(lowerToOriginal[bestItem])
                    .setStyle('PRIMARY')
                ,
                new MessageButton()
                    .setCustomId('spfind==' + bestItem + " Crate==")
                    .setLabel(lowerToOriginal[bestItem] + " Crate")
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId('cancel')
                    .setLabel('Cancel')
                    .setStyle('DANGER'),
            );

        await interaction.editReply({
            content: `Item \`${item}\` was not found. Did you mean: '${lowerToOriginal[bestItem]}' or '${lowerToOriginal[bestItem] + " Crate"}' instead?`,
            components: [row]
        });
        return false
    }



    return true;
}

export default spfind
