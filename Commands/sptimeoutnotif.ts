import { Client, CommandInteraction, GuildMember } from "discord.js";
import { getCollections } from '../mongoDB'
import checkPermissions from "../Utils/checkPermissions";
import checkTimeNotifs from "../Utils/checkTimeNotifs";

const sptimeoutnotif = async (interaction: CommandInteraction, client: Client, set: boolean): Promise<boolean> => {
    const role = interaction.options.getRole("role")! // Tell typescript to shut up cause it's gonna return a string and not null
    const collections = process.env.STOCKPILER_MULTI_SERVER === "true" ? getCollections(interaction.guildId) : getCollections()
    if (!role) {
        await interaction.reply({
            content: "Missing parameters",
            ephemeral: true
        });
        return false
    }

    await interaction.reply({ content: 'Working on it', ephemeral: true });

    const disableTimeNotif: any = NodeCacheObj.get("disableTimeNotif")
    const timeCheckDisabled = process.env.STOCKPILER_MULTI_SERVER === "true" ? disableTimeNotif[interaction.guildId!] : disableTimeNotif
    if (timeCheckDisabled) {
        await interaction.editReply({ content: "Error: The time-checking feature of Storeman Bot is disabled for this server. Please use `/spdisabletime` to enable it." })
        return false
    }

    const configObj = (await collections.config.findOne({}))!
    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false
    if (interaction.options.getSubcommand() === 'add') {
        if ("notifRoles" in configObj) {
            for (let i = 0; i < configObj.notifRoles.length; i++) {
                if (configObj.notifRoles[i] === role.id) {
                    await interaction.editReply("The role is already on the stockpile expiry notification list")
                    return false;
                }
            }
        }
        const notifRoles: any = NodeCacheObj.get("notifRoles")

        if (process.env.STOCKPILER_MULTI_SERVER === "true") notifRoles[interaction.guildId!].push(role.id)
        else notifRoles.push(role.id)

        await collections.config.updateOne({}, { $push: { notifRoles: role.id } })
        await interaction.editReply({ content: "Successfully added " + role.name + " to the stockpile expiry notification list", })
        checkTimeNotifs(client, true, false, interaction.guildId!)
    }
    else {
        let deleted = false
        if ("notifRoles" in configObj) {
            for (let i = 0; i < configObj.notifRoles.length; i++) {
                if (configObj.notifRoles[i] === role.id) {
                    configObj.notifRoles.splice(i, 1)
                    await collections.config.updateOne({}, { $set: { notifRoles: configObj.notifRoles } })

                    if (process.env.STOCKPILER_MULTI_SERVER === "true") {
                        const notifRoles: any = NodeCacheObj.get("notifRoles")
                        notifRoles[interaction.guildId!] = configObj.notifRoles
                    }
                    else NodeCacheObj.set("notifRoles", configObj.notifRoles)

                    deleted = true
                    break
                }
            }
        }
        else await interaction.editReply("The role is not present on the notification list")

        if (deleted) await interaction.editReply("The role `" + role.name + "` has been removed from the stockpile expiry notification list")
        else await interaction.editReply("The role is not present on the notification list")
    }

    return true;
}

export default sptimeoutnotif
