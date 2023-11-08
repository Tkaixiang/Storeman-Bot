import { Client, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { getCollections } from "../mongoDB";
import checkPermissions from "../Utils/checkPermissions";
import mongoSanitize from "express-mongo-sanitize";

const permsList = ["user", "admin"];

const spuser = async (
  interaction: ChatInputCommandInteraction,
  client: Client
): Promise<boolean> => {
  const userObj = interaction.options.getUser("user")!; // Tell typescript to shut up cause it's gonna return a string and not null
  const collections =
    process.env.STOCKPILER_MULTI_SERVER === "true"
      ? getCollections(interaction.guildId)
      : getCollections();

  if (
    !(await checkPermissions(
      interaction,
      "admin",
      interaction.member as GuildMember
    ))
  )
    return false;

  if (interaction.options.getSubcommand() === "set") {
    let perms = interaction.options.getString("perms")!;
    if (!perms || !userObj) {
      await interaction.editReply({
        content: "Missing parameters",
      });
      return false;
    }
    if (!permsList.includes(perms)) {
      await interaction.editReply({
        content:
          "Invalid permissions. Please use either 'admin' or 'user' (case-insensitive).",
      });
      return false;
    }
    const configObj = (await collections.config.findOne({}))!;

    const realSettingName =
      perms === "user" ? "individualUserPerms" : "individualAdminPerms";

    if ("individualAdminPerms" in configObj) {
      for (let i = 0; i < configObj.individualAdminPerms.length; i++) {
        if (configObj.individualAdminPerms[i] === userObj.id) {
          if (perms === "admin") {
            await interaction.editReply({
              content:
                "Error: The user `" +
                userObj.username +
                "` already has `" +
                perms +
                "`",
            });
            return false;
          } else {
            delete configObj.individualAdminPerms[i];
          }
        }
      }
    } 
     if ("individualUserPerms" in configObj) {
      for (let i = 0; i < configObj.individualUserPerms.length; i++) {
        if (configObj.individualUserPerms[i] === userObj.id) {
          if (perms === "user") {
            await interaction.editReply({
              content:
                "Error: The user `" +
                userObj.username +
                "` already has `" +
                perms +
                "`",
            });
            return false;
          } else {
            delete configObj.individualUserPerms[i];
          }
        }
      }
    }

    let updateObj: any = {};
    updateObj[realSettingName] = userObj.id;
    mongoSanitize.sanitize(updateObj, { replaceWith: "_" });
    await collections.config.updateOne({}, { $push: updateObj });
    await interaction.editReply({
      content:
        "Successfully added the user " +
        userObj.username +
        " with ID `" +
        userObj.id +
        "` to " +
        "'" +
        perms +
        "' perms.",
    });
  } else {
    const configObj = (await collections.config.findOne({}))!;
    let removed = false;
    if ("individualAdminPerms" in configObj) {
      for (let i = 0; i < configObj.individualAdminPerms.length; i++) {
        if (configObj.individualAdminPerms[i] === userObj.id) {
          mongoSanitize.sanitize(configObj, { replaceWith: "_" });
          configObj.individualAdminPerms.splice(i, 1);
          await collections.config.updateOne(
            {},
            { $set: { individualAdminPerms: configObj.individualAdminPerms } }
          );
          removed = true;
          break;
        }
      }
    }
    if ("individualUserPerms" in configObj && !removed) {
      for (let i = 0; i < configObj.individualUserPerms.length; i++) {
        if (configObj.individualUserPerms[i] === userObj.id) {
          mongoSanitize.sanitize(configObj, { replaceWith: "_" });
          configObj.individualUserPerms.splice(i, 1);
          await collections.config.updateOne(
            {},
            { $set: { individualUserPerms: configObj.individualUserPerms } }
          );
          removed = true;
          break;
        }
      }
    }
    if (removed)
      await interaction.editReply({
        content:
          "Successfully removed `" + userObj.username + "`'s permissions.",
      });
    else
      await interaction.editReply({
        content:
          "`" +
          userObj.username +
          "` does not have any permissions in Stockpiler Bot.",
      });
  }

  return true;
};

export default spuser;
