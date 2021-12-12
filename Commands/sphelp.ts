import { CommandInteraction } from "discord.js";

const sphelp = async (interaction: CommandInteraction): Promise<boolean> => {
    await interaction.reply({
        content: `**__Foxhole Stockpiler Discord Bot Version 0.1__** 
**Commands:**
- \`/sphelp\` Displays this message.
- \`/spstatus\` Displays the current stockpile status.
- \`/spsetamount <item> <amount> <stockpile>\` Sets the \`<amount>\` that an \`<item>\` has in **__crates__** inside the \`<stockpile>\`. (E.g \`/spsettarget Bmats 100\`)
- \`/sptarget set <item> <amount>\` Sets the target \`<amount>\` that an \`<item>\` should have in **__crates__**. (E.g \`/spsettarget Bmats 100\`)
- \`/sptarget remove <item>\` Removes a target item off the stockpile. 
- \`/splogichannel set <channel>\` Sets a logi channel in which stockpile information would always be displayed and updated on.
- \`/splogichannel remove <channel>\` Removes a logi channel in which stockpile information would always be displayed and updated on.
- \`/sprole add user <role>\` Add a role which will be allowed to update the stockpile information, but not manage the bot (normal user)
- \`/sprole remove user <role>\` Removes a role which has user permissions.
- \`/sprole add admin <role>\` Add a role which will be allowed to manage the bot (admin user).
- \`/sprole remove user <role>\` Removes a role which has admin permissions.

Currently in alpha testing, contact Tkai#8276 for help.
        `,
        ephemeral: true
    });

    return true;
}

export default sphelp