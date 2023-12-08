import { SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
require('dotenv').config();

const commands = [
    new SlashCommandBuilder().setName('sphelp').setDescription('View commands and information regarding the bot.'),
    new SlashCommandBuilder().setName('spitems').setDescription('View list of items'),
    new SlashCommandBuilder().setName('spsetamount')
        .setDescription('Sets the <amount> that an <item> has in crates inside the <stockpile>')
        .addStringOption((option) =>
            option.setName("item").setDescription("The item name").setRequired(true)
        ).addIntegerOption(option =>
            option.setName("amount").setDescription("The amount of that item").setRequired(true)
        ).addStringOption(option =>
            option.setName("stockpile").setDescription("The name of the stockpile").setRequired(true).setAutocomplete(true))
    ,
    new SlashCommandBuilder().setName('spsettimeleft')
        .setDescription('Sets the time left for a reserve <stockpile> before it expires. NOTE: <time> is a UNIX TIMESTAMP')
        .addStringOption((option) =>
            option.setName("stockpile").setDescription("The stockpile name").setRequired(true).setAutocomplete(true)
        ).addIntegerOption(option =>
            option.setName("time").setDescription("The time till the reserve stockpile expires. A Unix Timestamp.").setRequired(true))
    ,
    new SlashCommandBuilder().setName('sptarget')
        .setDescription('Command to edit the stockpile targets that the regiment (clan) should aim towards')
        .addSubcommand(subcommand =>
            subcommand
                .setName("set")
                .setDescription("Sets the target <minimum_amount> that an <item> should have in crates.")
                .addStringOption((option) =>
                    option.setName("item").setDescription("The item name").setRequired(true)
                ).addIntegerOption(option =>
                    option.setName("minimum_amount").setDescription("The minimum amount of that item").setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName("maximum_amount").setDescription("The maximum amount of that item").setRequired(false)
                ).addStringOption((option) =>
                    option.setName("production_location").setDescription("The place to produce this item. Either 'MPF' or 'Factory'")
                        .addChoices({ name: "MPF", value: "MPF" }, { name: "Factory", value: "Factory" })
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Removes target <item> from the target goals to achieve.")
                .addStringOption((option) =>
                    option.setName("item").setDescription("The item name").setRequired(true)
                )
        ),
    new SlashCommandBuilder().setName('spstatus').setDescription('Returns the current info. Optionally filter by targets/group targets/stockpile')
        .addStringOption(
            (option) => option.setName("filter").setDescription("View a filtered version of spstatus such as viewing only targets ")
                .addChoices({ name: "Targets", value: "targets" }, { name: "Group Targets", value: "group_targets" })
                .setRequired(false)
        )
        .addStringOption((option) => option.setName("stockpile_group").setDescription("View targets for a specific <stockpile_group>").setRequired(false))
        .addStringOption((option) => option.setName("stockpile").setDescription("View items in a <stockpile> only").setRequired(false).setAutocomplete(true))
    ,
    new SlashCommandBuilder().setName('spsetpassword').setDescription('Sets the password the Stockpiler app uses to update information to the database.')
        .addStringOption((option) => option.setName("password").setDescription("The new password").setRequired(true)),
    new SlashCommandBuilder().setName('spsetorder').setDescription('Sets the order of a <stockpile> to <order> number in the list')
        .addStringOption((option) => option.setName("stockpile").setDescription("The name of the stockpile to set the order of").setRequired(true).setAutocomplete(true))
        .addIntegerOption((option) => option.setName("order").setDescription("The order number to set to (1-N), where N is the number of stockpiles in the list").setRequired(true)),
    new SlashCommandBuilder().setName('spstockpile').setDescription('Commands to manage stockpiles')
        .addSubcommand(subcommand =>
            subcommand
                .setName("add")
                .setDescription("Creates an EMPTY stockpile with name <stockpile>")
                .addStringOption((option) => option.setName("stockpile").setDescription("Stockpile name").setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Deletes stockpile with the name <stockpile>")
                .addStringOption((option) => option.setName("stockpile").setDescription("Stockpile name").setRequired(true).setAutocomplete(true))
        ).addSubcommand(subcommand =>
            subcommand
                .setName("purge")
                .setDescription("Deletes all stockpiles and all their information. This is a destructive and irresvesible action")
        ),
    new SlashCommandBuilder().setName('splogichannel')
        .setDescription('Logi channel settings to broadcast the stockpile status.')
        .addSubcommand(subcommand =>
            subcommand
                .setName("set")
                .setDescription("Sets the target <channel> that the logi message will be in")
                .addChannelOption(option => option.setName("channel").setDescription("The channel the message will be in").setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Removes logi message from the set channel.")
        ),
    new SlashCommandBuilder().setName('sprole')
        .setDescription('Permission settings for roles')
        .addSubcommand(subcommand =>
            subcommand
                .setName("set")
                .setDescription("Add <perms> to a specified <role>")
                .addStringOption(option => option.setName("perms").setDescription("Can be either 'User' or 'Admin'.")
                    .setRequired(true)
                    .addChoices({ name: "User", value: "user" }, { name: "Admin", value: "admin" })
                )
                .addRoleOption(option => option.setName("role").setDescription("The role to operate on").setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Remove any perms from a specified <role>")
                .addRoleOption(option => option.setName("role").setDescription("The role to operate on").setRequired(true))

        ),
    new SlashCommandBuilder().setName('spuser')
        .setDescription('Permission settings for users')
        .addSubcommand(subcommand =>
            subcommand
                .setName("set")
                .setDescription("Add <perms> to a specified <user>")
                .addStringOption(option => option.setName("perms").setDescription("Can be either 'User' or 'Admin'.")
                    .setRequired(true)
                    .addChoices({ name: "User", value: "user" }, { name: "Admin", value: "admin" })
                )
                .addUserOption(option => option.setName("user").setDescription("The <user> to operate on").setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Remove any perms from a specified <user>")
                .addUserOption(option => option.setName("user").setDescription("The role to operate on").setRequired(true))

        ),
    new SlashCommandBuilder().setName('spnotif')
        .setDescription('Stockpile expiry notification settings')
        .addSubcommand(subcommand =>
            subcommand
                .setName("add")
                .setDescription("Adds <role> to the stockpile expiry notification list")
                .addRoleOption(option => option.setName("role").setDescription("The role to add").setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Remove the specified <role> from the stockpile expiry notification list")
                .addRoleOption(option => option.setName("role").setDescription("The role to remove").setRequired(true))

        ),
    new SlashCommandBuilder().setName('spprettyname')
        .setDescription('Stockpile pretty name settings.')
        .addSubcommand(subcommand =>
            subcommand
                .setName("add")
                .setDescription("Adds a <pretty_name> to the <stockpile>. Pretty names are alternative names")
                .addStringOption(option => option.setName("stockpile").setDescription("The stockpile to add a pretty name to").setRequired(true).setAutocomplete(true))
                .addStringOption(option => option.setName("pretty_name").setDescription("The pretty name to add").setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Removes a pretty name from the <stockpile>. Pretty names are alternative names")
                .addStringOption(option => option.setName("stockpile").setDescription("The stockpile to remove a pretty name from").setRequired(true).setAutocomplete(true))

        ),
    /*new SlashCommandBuilder().setName('spscan')
        .setDescription('Scan a screenshot of a stockpile')
        .addAttachmentOption(option => option.setName("screenshot").setDescription("Screenshot of the stockpile to scan").setRequired(true)),*/
    new SlashCommandBuilder().setName('spcode')
        .setDescription('Set/remove stockpile codes')
        .addSubcommand(subcommand =>
            subcommand
                .setName("add")
                .setDescription("Adds a <code> to a <stockpile>")
                .addStringOption(option => option.setName("stockpile").setDescription("The stockpile to add a code to").setRequired(true).setAutocomplete(true))
                .addStringOption(option => option.setName("code").setDescription("The stockpile code to add").setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Removes a code from the <stockpile>")
                .addStringOption(option => option.setName("stockpile").setDescription("The stockpile to remove a code from").setRequired(true).setAutocomplete(true))

        ),
    new SlashCommandBuilder().setName('sploc')
        .setDescription('Set/remove stockpile locations or location list')
        .addSubcommand(subcommand =>
            subcommand
                .setName("add")
                .setDescription("Adds a <location> to a <stockpile>")
                .addStringOption(option => option.setName("stockpile").setDescription("The stockpile to add a location to").setRequired(true).setAutocomplete(true))
                .addStringOption(option => option.setName("location").setDescription("The location to set to").setRequired(true).setAutocomplete(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Removes a location from the <stockpile>")
                .addStringOption(option => option.setName("stockpile").setDescription("The stockpile to remove a location from").setRequired(true).setAutocomplete(true))

        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("list")
                .setDescription("List all the locations and their location codes")
        ),
    new SlashCommandBuilder().setName('spfind')
        .setDescription('Finds the <item> specified in the stockpiles')
        .addStringOption((option) =>
            option.setName("item").setDescription("The item name").setRequired(true)
        )
    ,
    new SlashCommandBuilder().setName('spdisabletime')
        .setDescription('Disables the time-check feature on Storeman Bot')
        .addBooleanOption((option) =>
            option.setName("disable").setDescription("True to disable time-check and false to enable time-check").setRequired(true)
        ),
    new SlashCommandBuilder().setName('sprefresh')
        .setDescription('Refreshes the timer of ALL stockpiles, or an individual <stockpile> if a name is provided.')
        .addStringOption((option) =>
            option.setName("stockpile").setDescription("The stockpile name").setRequired(false).setAutocomplete(true)
        ),
    new SlashCommandBuilder().setName('spgroup')
        .setDescription('Commands for creating a target list for a list of selected stockpiles')
        .addSubcommand(subcommand =>
            subcommand
                .setName("create")
                .setDescription("Creates a stockpile group with <name>")
                .addStringOption(option => option.setName("name").setDescription("The name of the stockpile group to create").setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Removes stockpile group with <name>")
                .addStringOption(option => option.setName("name").setDescription("The name of the stockpile group to remove").setRequired(true).setAutocomplete(true))

        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("addstockpile")
                .setDescription("Adds the stockpile with <stockpileName> to the stockpile group with <name>")
                .addStringOption(option => option.setName("name").setDescription("The name of the stockpile group to add to").setRequired(true).setAutocomplete(true))
                .addStringOption(option => option.setName("stockpile_name").setDescription("The name of the stockpile to add to the stockpile group").setRequired(true).setAutocomplete(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("removestockpile")
                .setDescription("Removes the stockpile with <stockpileName> from the stockpile group with <name>")
                .addStringOption(option => option.setName("name").setDescription("The name of the stockpile group to remove from").setRequired(true).setAutocomplete(true))
                .addStringOption(option => option.setName("stockpile_name").setDescription("The name of the stockpile to remove from the stockpile group").setRequired(true).setAutocomplete(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("settarget")
                .setDescription("Sets targets for the stockpile group with <name>")
                .addStringOption(option => option.setName("name").setDescription("The name of the stockpile group to modify targets").setRequired(true).setAutocomplete(true))
                .addStringOption((option) =>
                    option.setName("item").setDescription("The item name").setRequired(true)
                ).addIntegerOption(option =>
                    option.setName("minimum_amount").setDescription("The minimum amount of that item").setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName("maximum_amount").setDescription("The maximum amount of that item").setRequired(false)
                ).addStringOption((option) =>
                    option.setName("production_location").setDescription("The place to produce this item. Either 'MPF' or 'Factory'")
                        .addChoices({ name: "MPF", value: "MPF" }, { name: "Factory", value: "Factory" })
                        .setRequired(false)
                )
        ).addSubcommand(subcommand =>
            subcommand
                .setName("removetarget")
                .setDescription("Removes the target <item> from stockpile group with <name>")
                .addStringOption(option => option.setName("name").setDescription("The name of the stockpile group to remove from").setRequired(true).setAutocomplete(true))
                .addStringOption(option => option.setName("item").setDescription("The name of the item to remove from targets").setRequired(true))
        )
].map(command => command.toJSON())


const rest = new REST({ version: '10' }).setToken(<string>process.env.STOCKPILER_TOKEN);


const insertCommands = async (guild_id?: string) => {

    if (guild_id) {
        await rest.put(Routes.applicationGuildCommands(<string>process.env.STOCKPILER_CLIENT_ID, <string>guild_id), { body: commands })
            .then(() => console.log('Successfully registered application commands to guild with ID: ' + guild_id))
            .catch(console.error);
    }
    else {
        // Guild based commands for development
        // ClientId is the bot "Copy ID"
        // GuildId is the server "Copy ID"
        if (process.env.STOCKPILER_GUILD_ID && process.env.STOCKPILER_GUILD_ID !== "") {
            await rest.put(Routes.applicationGuildCommands(<string>process.env.STOCKPILER_CLIENT_ID, <string>process.env.STOCKPILER_GUILD_ID), { body: commands })
                .then(() => console.log('Successfully registered application commands to guild.'))
                .catch(console.error);
        }
        // Global commands for deployment (Global commands take at least 1 hour to update after each change)
        else {
            await rest.put(
                Routes.applicationCommands(<string>process.env.STOCKPILER_CLIENT_ID),
                { body: commands },
            ).then(() => console.log('Successfully registered application commands globally.'))
                .catch(console.error);
        }
    }

}

export { insertCommands }
