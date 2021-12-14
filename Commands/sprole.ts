import { Client, CommandInteraction, GuildMember } from "discord.js";
import generateStockpileMsg from "../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";
import { getCollections } from '../mongoDB'
import checkPermissions from "../Utils/checkPermissions";


const permsList = ["user", "admin"]

const sprole = async (interaction: CommandInteraction, client: Client, set: boolean): Promise<boolean> => {
    const role = interaction.options.getRole("role")! // Tell typescript to shut up cause it's gonna return a string and not null
    const collections = getCollections()

    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false
    if (set) {
        const perms = interaction.options.getString("perms")
        if (!perms || !role) {
            await interaction.reply({
                content: "Missing parameters",
                ephemeral: true
            });
            return false
        }
        if (!permsList.includes(perms.toLowerCase())) {
            await interaction.reply({
                content: "Invalid permissions. Please use either 'admin' or 'user' (case-insensitive).",
                ephemeral: true
            });
            return false
        }

        let updateObj: any = {}
        updateObj[perms] = role.id
        await collections.config.updateOne({}, {$push: updateObj})
        await interaction.reply({content: "Successfully added " + role.name + " to " + "'" + perms +"' perms.", ephemeral: true})

    }
    else {
        const configObj = (await collections.config.findOne({}))!
        let removed = false
        if ("admin" in configObj) {
            for (let i = 0; i < configObj.admin.length; i++) {
                if (configObj.admin[i] === role.id) {
                    configObj.admin.slice(i, 1)
                    await collections.config.updateOne({}, {$set: {admin: configObj.admin}})
                    removed = true
                    break
                } 
            }
        }
        if ("user" in configObj && !removed) {
            for (let i = 0; i < configObj.user.length; i++) {
                if (configObj.user[i] === role.id) {
                    configObj.user.slice(i, 1)
                    await collections.config.updateOne({}, {$set: {user: configObj.user}})
                    removed = true
                    break
                } 
            }
        }
        if (removed) await interaction.reply({content: "Successfully removed '" + role.name + "' removed any permissions."})
        else await interaction.reply({content: "'" + role.name + "' does not have any permissions in Stockpiler Bot."})
    }

    return true;
}

export default sprole