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
            option.setName("stockpile").setDescription("The name of the stockpile").setRequired(true))
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
                        .addChoice("MPF", "MPF")
                        .addChoice("Factory", "Factory")
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
    new SlashCommandBuilder().setName('spstatus').setDescription('Returns the current stockpile and target information'),
    new SlashCommandBuilder().setName('spsetpassword').setDescription('Sets the password the Stockpiler app uses to update information to the database.')
        .addStringOption((option) => option.setName("password").setDescription("The new password").setRequired(true)),
    new SlashCommandBuilder().setName('spsetorder').setDescription('Sets the order of a <stockpile> to <order> number in the list')
        .addStringOption((option) => option.setName("stockpile").setDescription("The name of the stockpile to set the order of").setRequired(true))
        .addIntegerOption((option) => option.setName("order").setDescription("The order number to set to (1-N), where N is the number of stockpiles in the list").setRequired(true)),
    new SlashCommandBuilder().setName('spremovestockpile').setDescription('Removes the stockpile specified by <name>')
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
                .addStringOption((option) => option.setName("stockpile").setDescription("Stockpile name").setRequired(true))
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
        .setDescription('Role and permissions settings')
        .addSubcommand(subcommand =>
            subcommand
                .setName("set")
                .setDescription("Add <perms> to a specified <role>")
                .addStringOption(option => option.setName("perms").setDescription("Can be either 'User' or 'Admin'.")
                    .setRequired(true)
                    .addChoice("User", "user")
                    .addChoice("Admin", "admin")
                )
                .addRoleOption(option => option.setName("role").setDescription("The role to operate on").setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Remove any perms from a specified <role>")
                .addRoleOption(option => option.setName("role").setDescription("The role to operate on").setRequired(true))

        ),
]
    .map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(<string>process.env.token);


const insertCommands = async () => {
    // Guild based commands for development
    // ClientId is the bot "Copy ID"
    // GuildId is the server "Copy ID"
    if (process.env.NODE_ENV === "development") {
        await rest.put(Routes.applicationGuildCommands(<string>process.env.clientId, <string>process.env.guildId), { body: commands })
            .then(() => console.log('Successfully registered application commands to guild.'))
            .catch(console.error);
    }
    // Global commands for deployment (Global commands take at least 1 hour to update after each change)
    else {
        await rest.put(
            Routes.applicationCommands(<string>process.env.clientId),
            { body: commands },
        ).then(() => console.log('Successfully registered application commands globally.'))
            .catch(console.error);
    }
}

export { insertCommands }
