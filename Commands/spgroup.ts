import { Client, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { getCollections } from '../mongoDB'
import checkPermissions from "../Utils/checkPermissions";
import mongoSanitize from "express-mongo-sanitize";

const permsList = ["user", "admin"]

const spgroup = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
    const collections = process.env.STOCKPILER_MULTI_SERVER === "true" ? getCollections(interaction.guildId) : getCollections()

    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false
    await interaction.reply({content: 'Working on it', ephemeral: true});
    const config = await collections.config.findOne({})
    const stockpileGroupsObj = NodeCacheObj.get("stockpileGroups")

    if (interaction.options.getSubcommand() === 'create') {
        const name = interaction.options.getString("name")!
        if (!name) {
            await interaction.editReply({
                content: "Missing parameters"
            });
            return false
        }

        if ("stockpileGroups" in config) {
            await collections.config.updateOne({stockpileGroups: stockpileGroupsObj})
        }
        else {
            await collections.config.insertOne({stockpileGroups: stockpileGroupsObj})
        }
        


    }
    else if (interaction.options.getSubcommand() === 'delete') {

    }
    else if (interaction.options.getSubcommand() === 'add') {

    }
    else if (interaction.options.getSubcommand() === 'remove') {

    }

    return true;
}

export default spgroup
