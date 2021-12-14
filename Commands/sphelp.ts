import { CommandInteraction } from "discord.js";

const sphelp = async (interaction: CommandInteraction): Promise<boolean> => {
    await interaction.reply({
        content: `**__Foxhole Stockpiler Discord Bot Version 0.1__** 
**Commands:**
- \`/sphelp\` Displays this message.
- \`/spstatus\` Displays the current stockpile status. 🙍‍♂️
- \`/spsetamount <item> <amount> <stockpile>\` Sets the \`<amount>\` that an \`<item>\` has in **__crates__** inside the \`<stockpile>\`. (E.g \`/spsettarget Bmats 100\`) 🙍‍♂️
- \`/sptarget set <item> <amount>\` Sets the target \`<amount>\` that an \`<item>\` should have in **__crates__**. (E.g \`/spsettarget Bmats 100\`) 👨‍⚖️
- \`/sptarget remove <item>\` Removes a target item off the stockpile. 👨‍⚖️
- \`/spremovestockpile <stockpile>\` Removes the <stockpile> from the stockpile status. 👨‍⚖️
- \`/spsetpassword <password>\` Sets the password used to update information to the HTTP endpoint from the Stockpiler app. 👨‍⚖️
- \`/splogichannel set <channel>\` Sets a logi channel in which stockpile information would always be displayed and updated on. 👨‍⚖️
- \`/splogichannel remove <channel>\` Removes a logi channel in which stockpile information would always be displayed and updated on. 👨‍⚖️
- \`/sprole add <perms> <role>\` Add a role which will be allowed to have <perms>. <perms> can be either "Admin" or "User". 👨‍⚖️
- \`/sprole remove <role>\` Removes a role from whatever permissions they have. 👨‍⚖️

👨‍⚖️ - Commands that require at least \`Admin\` permissions
🙍‍♂️ - Commands that require at least \`User\` permissions

Currently in alpha testing, contact Tkai#8276 for help.
        `,
        ephemeral: true
    });

    return true;
}

export default sphelp