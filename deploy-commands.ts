import { SlashCommandBuilder, SlashCommandStringOption } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
require('dotenv').config();


const item_name: [name: string, value: string][] = [["Basic Materials", "bmats"], ["Explosive Materials", "emats"], ["Heavy Explosive Materials", "hemats"]]
const commands = [
    new SlashCommandBuilder().setName('sphelp').setDescription('View commands and information regarding the bot.'),
    new SlashCommandBuilder().setName('spsetamount')
        .setDescription('Sets the <amount> that an <item> has in crates inside the <stockpile>')
        .addStringOption((option) =>
            option.setName("item").setDescription("The item name").setRequired(true).addChoices(item_name)
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
                .setDescription("Sets the target <amount> that an <item> should have in crates.")
                .addStringOption((option) =>
                    option.setName("item").setDescription("The item name").setRequired(true).addChoices(item_name)
                ).addIntegerOption(option =>
                    option.setName("amount").setDescription("The amount of that item").setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Removes target <item> from the target goals to achieve.")
                .addStringOption((option) =>
                    option.setName("item").setDescription("The item name").setRequired(true).addChoices(item_name)
                )
        ),
    new SlashCommandBuilder().setName('spstatus').setDescription('Returns the current stockpile and target information'),
    new SlashCommandBuilder().setName('spsetpassword').setDescription('Sets the password the Stockpiler app uses to update information to the database.')
        .addStringOption((option) => option.setName("password").setDescription("The new password").setRequired(true)),
    new SlashCommandBuilder().setName('spremovestockpile').setDescription('Removes the stockpile specified by <name>')
        .addStringOption((option) => option.setName("stockpile").setDescription("Stockpile name").setRequired(true)),
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
]
    .map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(<string>process.env.token);


const insertCommands = async () => {
    // Guild based commands for development
    // ClientId is the bot "Copy ID"
    // GuildId is the server "Copy ID"
    console.log(process.env.NODE_ENV)
    if (process.env.NODE_ENV === "development") {
        await rest.put(Routes.applicationGuildCommands(<string>process.env.clientId, <string>process.env.guildId), { body: commands })
            .then(() => console.log('Successfully registered application commands.'))
            .catch(console.error);
    }
    // Global commands for deployment (Global commands take at least 1 hour to update after each change)
    else {
        await rest.put(
            Routes.applicationCommands(<string>process.env.clientId),
            { body: commands },
        );
    }
}

export { insertCommands }
