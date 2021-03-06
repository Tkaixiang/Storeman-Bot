import { CommandInteraction, MessageEmbed } from "discord.js";

const sphelp = async (interaction: CommandInteraction): Promise<boolean> => {
    await interaction.reply({
        content: "Working on it...",
        ephemeral: true
    });

    const helpEmbed: {fields: Array<any>, [key: string]: any} = {
        title: "Storeman Bot Command Help", description: `
Version 0.6 29/5/2022
Your GuildID is: \`${interaction.guildId}\`

ð¨ââï¸ - Commands that require at least \`Admin\` permissions
ðââï¸ - Commands that require at least \`User\` permissions
â - Denotes an **optional** parameter

Currently in alpha testing, contact Tkai#8276 for help.
`,
        fields: [],
    }

    let embedList = []

    const commandList = [
        {
            name: "/sphelp",
            value: "Displays this message."
        },
        {
            name: "/spstatus <filterâ> <stockpileâ>  ðââï¸",
            value: 'Displays the current stockpile status. <filter> can be "Targets" to display only targets. Specify a <stockpile> to show only details for that stockpile.'
        },
        {
            name: "/spsetamount <item> <amount> <stockpile>  ðââï¸",
            value: "Sets the \`<amount>\` that an \`<item>\` has in **__crates__** inside the \`<stockpile>\`. (E.g \`/spsetamount set Basic Materials Crate 100\`)"
        },
        {
            name: "/spfind <item>  ðââï¸",
            value: "Searches through all the stockpiles for the <item> specified and returns which stockpile has the item."
        },
        {
            name: "/sptarget set <item> <minimum_amount> <maximum_amountâ> <production_locationâ>  ð¨ââï¸",
            value: "Sets the target \`<minimum_amount>\` that an \`<item>\` should have in **__crates__**. (E.g \`/sptarget set Basic Materials Crate 100\`)"
        },
        {
            name: "/sptarget remove <item>  ð¨ââï¸",
            value: "Removes a target item off the stockpile."
        },
        {
            name: "/spstockpile add <stockpile>  ð¨ââï¸",
            value: "Adds an EMPTY stockpile with the name <stockpile>."
        },
        {
            name: "/spstockpile remove <stockpile>  ð¨ââï¸",
            value: "Removes the <stockpile> from the stockpile status and listings."
        },
        {
            name: "/spstockpile purge  ð¨ââï¸",
            value: "Purges all stockpiles and their related information such as pretty names and order settings."
        },
        {
            name: "/spsetpassword <password>  ð¨ââï¸",
            value: "Sets the password used to update information to the HTTP endpoint from the Stockpiler app."
        },
        {
            name: "/splogichannel set <channel>  ð¨ââï¸",
            value: "Sets a logi channel in which stockpile information would always be displayed and updated on."
        },
        {
            name: "/splogichannel remove  ð¨ââï¸",
            value: "Removes a logi channel in which stockpile information would always be displayed and updated on."
        },
        {
            name: "/sprole add <perms> <role>  ð¨ââï¸",
            value: 'Add a role which will be allowed to have <perms>. <perms> can be either "Admin" or "User".'
        },
        {
            name: "/sprole remove <role>  ð¨ââï¸",
            value: "Removes a role from whatever permissions they have."
        },
        {
            name: "/spsetorder <stockpile> <order>  ð¨ââï¸",
            value: "Sets the <order> of a <stockpile> in the logi channel message."
        },
        {
            name: "/spsettimeleft <stockpile> <time>  ð¨ââï¸",
            value: "Sets the time left for a reserve <stockpile> before it expires. **NOTE:** <time> is a **UNIX TIMESTAMP**"
        },
        {
            name: "/spnotif add <role>  ð¨ââï¸",
            value: "Adds a <role> to the notification stockpile expiry warning mention list."
        },
        {
            name: "/spnotif remove <role>  ð¨ââï¸",
            value: "Removes a <role> to the notification stockpile expiry warning mention list."
        },
        {
            name: "/spprettyname add <stockpile> <pretty_name>  ð¨ââï¸",
            value: "Adds a <pretty_name> to the <stockpile>. Pretty names are alternative names used to display the stockpile name instead of the original name."
        },
        {
            name: "/spprettyname remove <stockpile>  ð¨ââï¸",
            value: "Removes a pretty name from the <stockpile>. Pretty names are alternative names used to display the stockpile name instead of the original name."
        },
        {
            name: "/spcode add <stockpile> <code>  ð¨ââï¸",
            value: "Adds a stockpile <code> to the <stockpile> specified."
        },
        {
            name: "/spcode remove <stockpile>  ð¨ââï¸",
            value: "Removes the specified stockpile code from the <stockpile>."
        },
        {
            name: "/sploc add <stockpile> <location>  ð¨ââï¸",
            value: "Adds a stockpile <location> to the <stockpile> specified. "
        },
        {
            name: "/sploc remove <stockpile>  ð¨ââï¸",
            value: "Removes the specified stockpile location from the <stockpile>."
        },
        {
            name: "/sploc list  ð¨ââï¸",
            value: "Lists all the possible location codes with their respective full location translations."
        },
        {
            name: "/spdisabletime <disabled> ð¨ââï¸",
            value: "Whether or not to disable the time-checking feature of Storeman Bot"
        },

    ]

    for (let i = 0; i < commandList.length-1; i++) {
        if (commandList[i].name !== "\u200b") {
            commandList.splice(i+1, 0, {name: "\u200b", value: "\u200b"})
        }
    }


    while (commandList.length > 0) {
        if (commandList.length > 25) {
            if (helpEmbed.fields.length === 0){
                helpEmbed.fields = commandList.splice(0, 25)
                await interaction.editReply({content: "Help Message", embeds: [helpEmbed]})
            }
            else {
                embedList.push({
                    fields: commandList.splice(0, 25)
                })
            }
        }
        else {
            if (helpEmbed.fields.length === 0){
                helpEmbed.fields = commandList.splice(0, commandList.length)
                await interaction.editReply({content: "Help Message", embeds: [helpEmbed]})
            }
            else {
                embedList.push({
                    fields: commandList.splice(0, commandList.length)
                })
            }
        }
    }

    // Send calculated list of embeds
    for (let i = 0; i < embedList.length; i++) {
        await interaction.followUp({
            embeds: [embedList[i]],
            ephemeral: true
        })
    }

    return true;
}

export default sphelp
