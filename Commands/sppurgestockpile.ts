import { Client, CommandInteraction, GuildMember, MessageActionRow, MessageButton, TextChannel } from "discord.js";
import checkPermissions from "../Utils/checkPermissions";

const sppurgestockpile = async (interaction: CommandInteraction, client: Client): Promise<boolean> => {

    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false


    await interaction.reply({ content: 'Working on it', ephemeral: true });
    const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('sppurgestockpile==')
                .setLabel('Purge Stockpiles')
                .setStyle('DANGER'),
            new MessageButton()
                .setCustomId('cancel')
                .setLabel('Cancel')
                .setStyle('PRIMARY'),
        );
    await interaction.editReply({ content: 'Are you sure you want to purge all the stockpiles?', components: [row] });



    return true;
}

export default sppurgestockpile
