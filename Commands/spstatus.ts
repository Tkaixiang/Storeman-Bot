import { CommandInteraction } from "discord.js";
import generateMsg from '../Utils/generateStockpileMsg'

const spstatus = async (interaction: CommandInteraction): Promise<boolean> => {

    await interaction.reply({
        content: await generateMsg(false)
    });

    return true;
}

export default spstatus