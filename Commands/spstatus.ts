import { CommandInteraction, GuildMember } from "discord.js";
import checkPermissions from "../Utils/checkPermissions";
import generateStockpileMsg from '../Utils/generateStockpileMsg'

const spstatus = async (interaction: CommandInteraction): Promise<boolean> => {

    if (!(await checkPermissions(interaction, "user", interaction.member as GuildMember))) return false

    const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader] = await generateStockpileMsg(false)
    await interaction.reply(stockpileHeader);
    await interaction.followUp(targetMsg)
    await interaction.followUp(stockpileMsgsHeader)
    for (let i = 0; i < stockpileMsgs.length; i++) {
        await interaction.followUp(stockpileMsgs[i]);
    }

    return true;
}

export default spstatus