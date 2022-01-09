import { GuildMember, CommandInteraction, Permissions, MessageComponentInteraction } from "discord.js"
import { getCollections } from './../mongoDB'

const checkPermissions = async (interaction: CommandInteraction | MessageComponentInteraction, roleType: "admin" | "user", member: GuildMember) => {
    const collections = getCollections()
    const permsInfo = (await collections.config.findOne({}, { projection: { admin: 1, user: 1 } }))!
    let permsLevel = 0

    if ("admin" in permsInfo) {
        for (let i = 0; i < permsInfo.admin.length; i++) {
            if (member.roles.cache.has(permsInfo.admin[i])) permsLevel = 2
        }
    }

    if (member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)|| member.id === member.guild.ownerId) permsLevel = 2
    if ("user" in permsInfo && permsLevel === 0) {
        for (let i = 0; i < permsInfo.user.length; i++) {
            if (member.roles.cache.has(permsInfo.user[i])) permsLevel = 1
        }
    }

    if (roleType === "admin") {
        if (permsLevel === 2) return true
        else {
            interaction.followUp({ content: "Insufficient perms, you need at least '" + roleType + "'👨‍⚖️  to use this command", ephemeral: true })
            return false
        }

    }
    else {
        if (permsLevel >= 1) return true
        else {
            interaction.followUp({ content: "Insufficient perms, you need at least '" + roleType + "'🙍‍♂️ to use this command", ephemeral: true })
            return false
        }

    }

    return false
}

export default checkPermissions