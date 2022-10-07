import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { getCollections } from './../mongoDB';
import argon2 from 'argon2';
import checkPermissions from "../Utils/checkPermissions";


const spsetpassword = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {
    const password = interaction.options.getString("password")! // Tell typescript to shut up and it is non-null
    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false
    
    if (!password) {
        await interaction.editReply({
            content: "Missing parameters"
        });
        return false
    }

    const collections = process.env.STOCKPILER_MULTI_SERVER === "true" ? getCollections(interaction.guildId) : getCollections()
    await collections.config.updateOne({}, { $set: { password: await argon2.hash(password) } })

    await interaction.editReply({
        content: "Password successfully changed."
    });

    return true;
}

export default spsetpassword
