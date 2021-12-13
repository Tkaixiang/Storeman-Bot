import { CommandInteraction } from "discord.js";
import { getCollections } from './../mongoDB';
import argon2 from 'argon2';

const spsetpassword = async (interaction: CommandInteraction): Promise<boolean> => {
    const password = interaction.options.getString("password")! // Tell typescript to shut up and it is non-null

    if (!password) {
        await interaction.reply({
            content: "Missing parameters"
        });
        return false
    }

    const collections = getCollections()
    collections.config.updateOne({}, { $set: { password: await argon2.hash(password) } })

    await interaction.reply({
        content: "Password successfully changed.",
        ephemeral: true
    });

    return true;
}

export default spsetpassword