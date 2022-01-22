import { CommandInteraction } from "discord.js";

const sphelp = async (interaction: CommandInteraction): Promise<boolean> => {
    await interaction.reply({
        content: "Working on it...",
        ephemeral: true
    });

    let msg = `**__Foxhole Stockpiler Discord Bot Version 0.2 22/01/2022__** 
**Commands:**
- \`/sphelp\` Displays this message.
- \`/spstatus <filter❓> <stockpile❓>\` Displays the current stockpile status. <filter> can be "Targets" to display only targets. Specify a <stockpile> to show only details for that stockpile 🙍‍♂️
- \`/spsetamount <item> <amount> <stockpile>\` Sets the \`<amount>\` that an \`<item>\` has in **__crates__** inside the \`<stockpile>\`. (E.g \`/spsetamount set Basic Materials Crate 100\`) 🙍‍♂️
- \`/sptarget set <item> <minimum_amount> <maximum_amount❓> <production_location❓>\` Sets the target \`<minimum_amount>\` that an \`<item>\` should have in **__crates__**. (E.g \`/sptarget set Basic Materials Crate 100\`) 👨‍⚖️
- \`/sptarget remove <item>\` Removes a target item off the stockpile. 👨‍⚖️
- \`/spstockpile add <stockpile>\` Adds an EMPTY stockpile with the name <stockpile>
- \`/spstockpile remove <stockpile>\` Removes the <stockpile> from the stockpile status and listings. 👨‍⚖️
- \`/spsetpassword <password>\` Sets the password used to update information to the HTTP endpoint from the Stockpiler app. 👨‍⚖️
- \`/splogichannel set <channel>\` Sets a logi channel in which stockpile information would always be displayed and updated on. 👨‍⚖️
- \`/splogichannel remove\` Removes a logi channel in which stockpile information would always be displayed and updated on. 👨‍⚖️
- \`/sprole add <perms> <role>\` Add a role which will be allowed to have <perms>. <perms> can be either "Admin" or "User". 👨‍⚖️
- \`/sprole remove <role>\` Removes a role from whatever permissions they have. 👨‍⚖️
- \`/spsetorder <stockpile> <order>\` Sets the <order> of a <stockpile> in the logi channel message. 👨‍⚖️
- \`/spsettimeleft <stockpile> <time>\` Sets the time left for a reserve <stockpile> before it expires. NOTE: <time> is a UNIX TIMESTAMP 👨‍⚖️
- \`/spnotif add <role>\` Adds a <role> to the notification stockpile expiry warning mention list. 👨‍⚖️
- \`/spnotif remove <role>\` Removes a <role> to the notification stockpile expiry warning mention list. 👨‍⚖️
- \`/spprettyname add <stockpile> <pretty_name>\` Adds a <pretty_name> to the <stockpile>. Pretty names are alternative names used to display the stockpile name instead of the original name. 👨‍⚖️
- \`/spprettyname remove <stockpile>\` Removes a pretty name from the <stockpile>. Pretty names are alternative names used to display the stockpile name instead of the original name. 👨‍⚖️


👨‍⚖️ - Commands that require at least \`Admin\` permissions
🙍‍♂️ - Commands that require at least \`User\` permissions
❓ - Denotes an **optional** parameter

Currently in alpha testing, contact Tkai#8276 for help.
        `

    while (msg.length > 0) {
        if (msg.length > 2000) {
            const sliced = msg.slice(0, 2000)
            const lastEnd = sliced.lastIndexOf("\n")
            const finalMsg = sliced.slice(0, lastEnd)

            await interaction.followUp({
                content: finalMsg,
                ephemeral: true
            });
            msg = msg.slice(lastEnd, msg.length)
        }
        else {
            await interaction.followUp({
                content: msg,
                ephemeral: true
            });
            msg = ""
        }
    }

    return true;
}

export default sphelp
