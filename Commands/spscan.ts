import { Client, CommandInteraction, GuildMember } from "discord.js";
import { getCollections } from "../mongoDB";
import checkPermissions from "../Utils/checkPermissions";
import generateStockpileMsg from '../Utils/generateStockpileMsg'

const spscan = async (interaction: CommandInteraction, client: Client): Promise<boolean> => {
    let scannedImage: any = interaction.options.get("screenshot")!
    
    if (!(await checkPermissions(interaction, "user", interaction.member as GuildMember))) return false
    await interaction.reply({ content: 'Working on it', ephemeral: true });

    console.log(scannedImage.attachment.url)


    return true;
}

export default spscan