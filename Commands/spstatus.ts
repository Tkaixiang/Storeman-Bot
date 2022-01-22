import { CommandInteraction, GuildMember } from "discord.js";
import checkPermissions from "../Utils/checkPermissions";
import generateStockpileMsg from '../Utils/generateStockpileMsg'

const spstatus = async (interaction: CommandInteraction): Promise<boolean> => {
    let stockpile = interaction.options.getString("stockpile")!
    let filter = interaction.options.getString("filter")!

    if (!(await checkPermissions(interaction, "user", interaction.member as GuildMember))) return false
    await interaction.reply("Working on it...")

    const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader, stockpileNames] = await generateStockpileMsg(false)
    if (filter) {
        if (filter === "targets") {
            await interaction.editReply(targetMsg)
        } 
    }
    else {
        if (stockpile) {
            stockpile = stockpile.replace(/\./g, "").replace(/\$/g, "")
            let found = false
            for (let i = 0; i < stockpileNames.length; i++) {
                if (stockpileNames[i] === stockpile) {
                    found = true
                    break
                }
            }

            if (found) {
                let stockpileMsgStartFound = false
                for (let i = 0; i < stockpileMsgs.length; i++) {
                    if (!stockpileMsgStartFound) {
                        const currentIndex=  stockpileMsgs[i].indexOf(" (last scan")
                        if (currentIndex !== -1) {
                            if (stockpileMsgs[i].slice(0, currentIndex) === stockpile) {
                                stockpileMsgStartFound = true
                            }
                        }
                    }

                    if (stockpileMsgStartFound) {
                        await interaction.followUp(stockpileMsgs[i])
                        if (stockpileMsgs[i].slice(stockpileMsgs[i].length - 3) === "---") break
                    }
                }
            }
            else await interaction.editReply("Unable to find the stockpile with the name `" + stockpile + "`.")
        }
        else {
            await interaction.editReply(stockpileHeader);
            await interaction.followUp(targetMsg)
            await interaction.followUp(stockpileMsgsHeader)
            for (let i = 0; i < stockpileMsgs.length; i++) {
                await interaction.followUp(stockpileMsgs[i]);
            }
        }
     
    }


    return true;
}

export default spstatus