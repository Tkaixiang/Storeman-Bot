import { Client, CommandInteraction, GuildMember, MessageActionRow, MessageButton } from "discord.js";
import { getCollections } from './../mongoDB'
import generateStockpileMsg from "./../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";
import checkPermissions from "../Utils/checkPermissions";
import findBestMatchItem from "../Utils/findBestMatchItem";
import mongoSanitize from "express-mongo-sanitize";

const spsettarget = async (interaction: CommandInteraction, client: Client): Promise<boolean> => {
    let item = interaction.options.getString("item")! // Tell typescript to shut up and it is non-null
    const minimum_amount = interaction.options.getInteger("minimum_amount")
    let maximum_amount = interaction.options.getInteger("maximum_amount")
    const lowerToOriginal: any = NodeCacheObj.get("lowerToOriginal")
    let production_location = interaction.options.getInteger("production_location")!
    if (!maximum_amount) maximum_amount = 0

    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false

    if (!minimum_amount || !item) {
        await interaction.reply({
            content: "Missing parameters",
            ephemeral: true
        });
        return false
    }

    await interaction.reply('Working on it');

    const collections = getCollections()
    const listWithCrates = NodeCacheObj.get("listWithCrates") as Array<string>

    const cleanitem = item.replace(/\./g, "_").toLowerCase()
    if (!listWithCrates.includes(cleanitem)) {
        const bestItem = findBestMatchItem(cleanitem).replace("_", ".")

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('spsettarget==' + bestItem + "==" + minimum_amount + "==" + maximum_amount)
                    .setLabel(lowerToOriginal[bestItem])
                    .setStyle('PRIMARY')
                ,
                new MessageButton()
                    .setCustomId('spsettarget==' + bestItem + " Crate==" + minimum_amount + "==" + maximum_amount)
                    .setLabel(lowerToOriginal[bestItem] + " Crate")
                    .setStyle('PRIMARY'),
                    new MessageButton()
                    .setCustomId('cancel')
                    .setLabel('Cancel')
                    .setStyle('DANGER'),
            );


        await interaction.editReply({
            components: [row],
            content: `Item \`${item}\` was not found. Did you mean: \`${lowerToOriginal[bestItem]}\` or \`${lowerToOriginal[bestItem] + " Crate"}\` instead?`
        });
        return false
    }

    let updateObj: any = {}
    updateObj[cleanitem] = { min: minimum_amount, max: maximum_amount, prodLocation: production_location }
    mongoSanitize.sanitize(updateObj, { replaceWith: "_" })
    if ((await collections.targets.updateOne({}, { $set: updateObj })).modifiedCount === 0) {
        await collections.targets.insertOne(updateObj)
    }

    const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, stockpileNames] = await generateStockpileMsg(true)
    await updateStockpileMsg(client, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader], stockpileNames)

    await interaction.editReply({
        content: `Item \`${lowerToOriginal[item]}\` has been added with a target of minimum ${minimum_amount} crates and maximum ${maximum_amount !== 0 ? maximum_amount : "unlimited"} crates.`
    });

    return true;
}

export default spsettarget
