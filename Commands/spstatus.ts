import { CommandInteraction, GuildMember } from "discord.js";
import checkPermissions from "../Utils/checkPermissions";
import generateMsg from '../Utils/generateStockpileMsg'

const spstatus = async (interaction: CommandInteraction): Promise<boolean> => {

    if (!(await checkPermissions(interaction, "user", interaction.member as GuildMember))) return false

    await interaction.reply({
        content: await generateMsg(false)
    });

    return true;
}

export default spstatus