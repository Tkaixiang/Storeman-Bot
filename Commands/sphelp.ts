import { ChatInputCommandInteraction } from "discord.js";
import { UPDATE_DATE, VERSION } from "../constants";

const sphelp = async (
  interaction: ChatInputCommandInteraction,
): Promise<boolean> => {
  const helpEmbed: { fields: Array<any>; [key: string]: any } = {
    title: "Storeman Bot Command Help",
    fields: [],
  };

  let embedList = [];

  const commandList = [
    {
      name: "/sphelp",
      value: "Displays this message.",
    },
    {
      name: "/spstatus <filter❓> <stockpile❓> <stockpile_group❓>  🙍‍♂️",
      value:
        'Displays the current full stockpile status if no options are specified. \n\nSpecify a `<stockpile>` to show only details for that stockpile, **do not** specify `<filter>` if this option is specified.\n\n `<filter>` can be "Targets" to display only targets or "Group Targets" to display stockpile group targets.\n\n Specify a `<stockpile_group>` to show that stockpile group target only.',
    },
    {
      name: "/spsetamount <item> <amount> <stockpile>  🙍‍♂️",
      value:
        "Sets the `<amount>` that an `<item>` has in **__crates__** inside the `<stockpile>`. (E.g `/spsetamount set Basic Materials Crate 100`)",
    },
    {
      name: "/spfind <item>  🙍‍♂️",
      value:
        "Searches through all the stockpiles for the <item> specified and returns which stockpile has the item.",
    },
    {
      name: "/sprefresh <stockpile❓>  🙍‍♂️",
      value:
        "Refreshes the timer of **ALL stockpiles** if **no name is specified**, or the timer of `<stockpile>`",
    },
    {
      name: "/sptarget set <item> <minimum_amount> <maximum_amount❓> <production_location❓>  👨‍⚖️",
      value:
        "Sets the target `<minimum_amount>` that an `<item>` should have in **__crates__**. (E.g `/sptarget set Basic Materials Crate 100`)",
    },
    {
      name: "/sptarget remove <item>  👨‍⚖️",
      value: "Removes a target item off the stockpile.",
    },
    {
      name: "/spstockpile add <stockpile>  👨‍⚖️",
      value: "Adds an EMPTY stockpile with the name <stockpile>.",
    },
    {
      name: "/spstockpile remove <stockpile>  👨‍⚖️",
      value: "Removes the <stockpile> from the stockpile status and listings.",
    },
    {
      name: "/spstockpile purge  👨‍⚖️",
      value:
        "Purges all stockpiles and their related information such as pretty names and order settings.",
    },
    {
      name: "/spsetpassword <password>  👨‍⚖️",
      value:
        "Sets the password used to update information to the HTTP endpoint from the Stockpiler app.",
    },
    {
      name: "/splogichannel set <channel>  👨‍⚖️",
      value:
        "Sets a logi channel in which stockpile information would always be displayed and updated on.",
    },
    {
      name: "/splogichannel remove  👨‍⚖️",
      value:
        "Removes a logi channel in which stockpile information would always be displayed and updated on.",
    },
    {
      name: "/sprole add <perms> <role>  👨‍⚖️",
      value:
        'Add a role which will be allowed to have <perms>. <perms> can be either "Admin" or "User".',
    },
    {
      name: "/sprole remove <role>  👨‍⚖️",
      value: "Removes a role from whatever permissions they have.",
    },
    {
      name: "/spuser add <perms> <user>  👨‍⚖️",
      value:
        'Add a user which will be allowed to have <perms>. <perms> can be either "Admin" or "User".',
    },
    {
      name: "/spuser remove <user>  👨‍⚖️",
      value: "Removes a user from whatever permissions they have.",
    },
    {
      name: "/spsetorder <stockpile> <order>  👨‍⚖️",
      value: "Sets the <order> of a <stockpile> in the logi channel message.",
    },
    {
      name: "/spsettimeleft <stockpile> <time>  👨‍⚖️",
      value:
        "Sets the time left for a reserve <stockpile> before it expires. **NOTE:** <time> is a **UNIX TIMESTAMP**",
    },
    {
      name: "/spnotif add <role>  👨‍⚖️",
      value:
        "Adds a <role> to the notification stockpile expiry warning mention list.",
    },
    {
      name: "/spnotif remove <role>  👨‍⚖️",
      value:
        "Removes a <role> to the notification stockpile expiry warning mention list.",
    },
    {
      name: "/spprettyname add <stockpile> <pretty_name>  👨‍⚖️",
      value:
        "Adds a <pretty_name> to the <stockpile>. Pretty names are alternative names used to display the stockpile name instead of the original name.",
    },
    {
      name: "/spprettyname remove <stockpile>  👨‍⚖️",
      value:
        "Removes a pretty name from the <stockpile>. Pretty names are alternative names used to display the stockpile name instead of the original name.",
    },
    {
      name: "/spcode add <stockpile> <code>  👨‍⚖️",
      value: "Adds a stockpile <code> to the <stockpile> specified.",
    },
    {
      name: "/spcode remove <stockpile>  👨‍⚖️",
      value: "Removes the specified stockpile code from the <stockpile>.",
    },
    {
      name: "/sploc add <stockpile> <location>  👨‍⚖️",
      value: "Adds a stockpile <location> to the <stockpile> specified. ",
    },
    {
      name: "/sploc remove <stockpile>  👨‍⚖️",
      value: "Removes the specified stockpile location from the <stockpile>.",
    },
    {
      name: "/sploc list  👨‍⚖️",
      value:
        "Lists all the possible location codes with their respective full location translations.",
    },
    {
      name: "/spdisabletime <disabled> 👨‍⚖️",
      value:
        "Whether or not to disable the time-checking feature of Storeman Bot",
    },
    {
      name: "/spgroup create <name> 👨‍⚖️",
      value: "Creates a stockpile group with <name>",
    },
    {
      name: "/spgroup delete <name> 👨‍⚖️",
      value: "Removes stockpile group with <name>",
    },
    {
      name: "/spgroup addstockpile <name> <stockpileName> 👨‍⚖️",
      value:
        "Adds the stockpile with <stockpileName> to the stockpile group with <name>",
    },
    {
      name: "/spgroup removestockpile <name> 👨‍⚖️",
      value:
        "Removes the stockpile with <stockpileName> from the stockpile group with <name>",
    },
    {
      name: "/spgroup settarget <name> <item> <minimum_amount> <maximum_amount❓> <production_location❓> 👨‍⚖️",
      value:
        "Sets targets for the stockpile group with <name>, along with `<minimum_amount>` that an `<item>` should have in **__crates__**. (E.g `/sptarget set Basic Materials Crate 100`)",
    },
    {
      name: "/spgroup removetarget <name> <item> 👨‍⚖️",
      value:
        "Removes the target <item> from stockpile group targets list with <name>",
    },
  ];

  for (let i = 0; i < commandList.length - 1; i++) {
    if (commandList[i].name !== "\u200b") {
      commandList.splice(i + 1, 0, { name: "\u200b", value: "\u200b" });
    }
  }

  while (commandList.length > 0) {
    if (commandList.length > 25) {
      if (helpEmbed.fields.length === 0) {
        helpEmbed.fields = commandList.splice(0, 25);
        await interaction.editReply({
          content: "Help Message",
          embeds: [helpEmbed],
        });
      } else {
        embedList.push({
          fields: commandList.splice(0, 25),
        });
      }
    } else {
      if (helpEmbed.fields.length === 0) {
        helpEmbed.fields = commandList.splice(0, commandList.length);
        await interaction.editReply({
          content: "Help Message",
          embeds: [helpEmbed],
        });
      } else {
        embedList.push({
          fields: commandList.splice(0, commandList.length),
        });
      }
    }
  }

  // Send calculated list of embeds
  for (let i = 0; i < embedList.length; i++) {
    await interaction.followUp({
      embeds: [embedList[i]],
      ephemeral: true,
    });
  }

  await interaction.followUp({
    embeds: [
      {
        title: `Storeman Bot Help Menu`,
        description: `
            Version ${VERSION} (${UPDATE_DATE})
            Your GuildID is: **__\`${interaction.guildId}\`__** (this is the vale you should be inputting into Stockpiler to send scanned data!)
            
            👨‍⚖️ - Commands that require at least \`Admin\` permissions
            🙍‍♂️ - Commands that require at least \`User\` permissions
            ❓ - Denotes an **optional** parameter
            
            Currently in beta testing, contact Tkai#8276 for help.`,
      },
    ],
    ephemeral: true,
  });

  return true;
};

export default sphelp;
