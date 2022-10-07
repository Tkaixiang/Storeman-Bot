import { Client, ChatInputCommandInteraction, GuildMember, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import checkPermissions from "../Utils/checkPermissions";

const sppurgestockpile = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {

    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false


    
    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('sppurgestockpile==')
                .setLabel('Purge Stockpiles')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('cancel')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Primary),
        );
    await interaction.editReply({ content: 'Are you sure you want to purge all the stockpiles?', components: [row] });



    return true;
}

export default sppurgestockpile
