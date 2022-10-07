import { ChatInputCommandInteraction } from "discord.js";

const sphelp = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {
    

    let msg = "**__Location Mappings__** \n<Location Code> - <Full Location Name>**\n\n"
    const locationMappings: any = NodeCacheObj.get("locationMappings")
    for (const code in locationMappings) {
        msg += "`" + code + "`: " + locationMappings[code] + "\n"
    }

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
