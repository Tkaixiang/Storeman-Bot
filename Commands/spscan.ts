import { Client, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { getCollections } from "../mongoDB";
import checkPermissions from "../Utils/checkPermissions";
import fs from "fs";
import https from "https";
import generateStockpileMsg from '../Utils/generateStockpileMsg'

const spscan = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
    let scannedImage: any = interaction.options.get("screenshot")!

    if (!(await checkPermissions(interaction, "user", interaction.member as GuildMember))) return false
    await interaction.reply({ content: 'Working on it', ephemeral: true });

    console.log(scannedImage)
    let fileName = process.env.STOCKPILER_MULTI_SERVER === "true" ? interaction.guildId! : "scanImage"
    let file = fs.createWriteStream(fileName);

    let request = https.get(scannedImage.attachment.proxyURL, (response) => {
        response.pipe(file);
        file.on('finish', async () => {
            file.close();  // close() is async, call cb after close completes.
            await interaction.editReply({ content: 'File Uploaded' });
        });
    }).on('error', async (err) => { // Handle errors
        fs.unlink(fileName, () => { }); // Delete the file async. (But we don't check the result)
        await interaction.editReply({ content: 'An error occurred in uploading the scan image. Error: ' + err });
    });


    return true;
}

export default spscan