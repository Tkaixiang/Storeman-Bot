import { Interaction, Client, Guild, GatewayIntentBits } from "discord.js";
import { insertCommands } from "./deploy-commands";
import { open, getCollections, getMongoClientObj } from "./mongoDB";
import sphelp from "./Commands/sphelp";
import spsetamount from "./Commands/spsetamount";
import spstatus from "./Commands/spstatus";
import spsettarget from "./Commands/spsettarget";
import spremovetarget from "./Commands/spremovetarget";
import spsetpassword from "./Commands/spsetpassword";
import spsetlogichannel from "./Commands/spsetlogichannel";
import spremovelogichannel from "./Commands/spremovelogichannel";
import NodeCache from "node-cache";
import spremovestockpile from "./Commands/spremovestockpile";
import spaddstockpile from "./Commands/spaddstockpile";
import spnotif from "./Commands/sptimeoutnotif";
import sprole from "./Commands/sprole";
import stockpilerUpdateStockpile from "./Utils/stockpilerUpdateStockpile";
import spitems from "./Commands/spitems";
import spsetorder from "./Commands/spsetorder";
import buttonHandler from "./Utils/buttonHandler";
import checkTimeNotifs from "./Utils/checkTimeNotifs";
import http from "http";
import crypto from "crypto";
import argon2 from "argon2";
import spsettimeleft from "./Commands/spsettimeleft";
import fs from "fs";
import csv from "csv-parser";
import spaddprettyname from "./Commands/spaddprettyname";
import spremoveprettyname from "./Commands/spremoveprettyname";
import sppurgestockpile from "./Commands/sppurgestockpile";
import spaddcode from "./Commands/spaddcode";
import spremovecode from "./Commands/spremovecode";
import spaddloc from "./Commands/spaddloc";
import spremoveloc from "./Commands/spremoveloc";
import splistloc from "./Commands/splistloc";
import spfind from "./Commands/spfind";
import spdisabletime from "./Commands/spdisabletime";
import spgroup from "./Commands/spgroup";
import sprefresh from "./Commands/sprefresh";
import spuser from "./Commands/spuser";
import autoCompleteHandler from "./Utils/autoCompleteHandler";

require("dotenv").config();
const host = process.env.APP_HOST ? process.env.APP_HOST : "0.0.0.0";
const currentVersion = 22;
const commandMapping: any = {
  sphelp: { sub: false, vars: 1, handler: sphelp },
  spcode: {
    sub: true,
    handler: {
      add: { func: spaddcode, vars: 2 },
      remove: { func: spremovecode, vars: 2 },
    },
  },
  sploc: {
    sub: true,
    handler: {
      add: { func: spaddloc, vars: 2 },
      remove: { func: spremoveloc, vars: 2 },
      list: { func: splistloc, vars: 1 },
    },
  },
  spprettyname: {
    sub: true,
    handler: {
      add: { func: spaddprettyname, vars: 2 },
      remove: { func: spremoveprettyname, vars: 2 },
    },
  },
  sptarget: {
    sub: true,
    handler: {
      set: { func: spsettarget, vars: 2 },
      remove: { func: spremovetarget, vars: 2 },
    },
  },
  splogichannel: {
    sub: true,
    handler: {
      set: { func: spsetlogichannel, vars: 2 },
      remove: { func: spremovelogichannel, vars: 2 },
    },
  },
  sprole: { sub: false, vars: 1, handler: sprole },
  spnotif: { sub: false, vars: 1, handler: spnotif },
  spstockpile: {
    sub: true,
    handler: {
      add: { func: spaddstockpile, vars: 2 },
      remove: { func: spremovestockpile, vars: 2 },
      purge: { func: sppurgestockpile, vars: 2 },
    },
  },
  spdisabletime: { sub: false, vars: 2, handler: spdisabletime },
  spfind: { sub: false, vars: 1, handler: spfind },
  spitems: { sub: false, vars: 1, handler: spitems },
  sprefresh: { sub: false, vars: 1, handler: sprefresh },
  spsetamount: { sub: false, vars: 2, handler: spsetamount },
  spstatus: { sub: false, vars: 1, handler: spstatus },
  spsetpassword: { sub: false, vars: 1, handler: spsetpassword },
  spsetorder: { sub: false, vars: 2, handler: spsetorder },
  spsettimeleft: { sub: false, vars: 2, handler: spsettimeleft },
  spgroup: { sub: false, vars: 2, handler: spgroup },
  spuser: { sub: false, vars: 1, handler: spuser },
};
const timerBP = [60 * 5, 60 * 10, 60 * 30, 60 * 60, 60 * 60 * 6, 60 * 60 * 12]; // Timer breakpoints in seconds

declare global {
  var NodeCacheObj: NodeCache;
}

const updateFirstTimeSetup = async (newInstance: boolean): Promise<void> => {
  // Run first-time setup
  const collections = getCollections();
  insertCommands();

  if (newInstance) {
    const password = crypto.randomBytes(32).toString("hex");
    console.info(
      "Generated a random password since none was previously set: " +
        password +
        ". You can change this using /spsetpassword via the bot"
    );
    await collections.config.insertOne({
      version: currentVersion,
      password: await argon2.hash(password),
    });
    console.log("Completed first-time setup");
  } else {
    await collections.config.updateOne(
      {},
      { $set: { version: currentVersion } }
    );
    console.info("Completed Storeman Bot update");
  }
};

const guildCreateEventHandler = async (guild: Guild) => {
  const collections = getCollections(guild.id);
  const configObj = await collections.config.findOne({});
  if (!configObj) {
    // The bot has joined a new server
    console.log(
      "Bot has joined a new server named: " +
        guild.name +
        " with ID: " +
        guild.id
    );
    const password = crypto.randomBytes(32).toString("hex");
    await collections.config.insertOne({
      password: await argon2.hash(password),
    });

    // Insert commands into that guild
    insertCommands(guild.id);

    // Add the server record into the global settings list
    const globalCollection = getCollections("global-settings");
    await globalCollection.config.updateOne(
      {},
      { $push: { serverIDList: guild.id } }
    );

    const stockpileTimes: any = NodeCacheObj.get("stockpileTimes");
    const disableTimeNotif: any = NodeCacheObj.get("disableTimeNotif");
    const notifRoles: any = NodeCacheObj.get("notifRoles");
    const prettyName: any = NodeCacheObj.get("prettyName");
    const stockpileGroups: any = NodeCacheObj.get("stockpileGroups");

    stockpileTimes[guild.id] = {};
    notifRoles[guild.id] = [];
    prettyName[guild.id] = {};
    disableTimeNotif[guild.id] = false;
    stockpileGroups[guild.id] = {};
  }
};

const guildDeleteEventHandler = async (guildID: string) => {
  console.log(
    "Bot has been kicked (or deleted) from the server with ID:" + guildID
  );
  const mongoClient = getMongoClientObj();
  const db = mongoClient.db("stockpiler-" + guildID);
  await db.dropDatabase();

  const collections = getCollections("global-settings");
  const configObj = await collections.config.findOne({});
  let found = false;
  for (let i = 0; i < configObj.serverIDList.length; i++) {
    if (configObj.serverIDList[i] === guildID) {
      found = true;
      configObj.serverIDList.splice(i, 1);
      break;
    }
  }
  if (found) {
    await collections.config.updateOne(
      {},
      { $set: { serverIDList: configObj.serverIDList } }
    );
    const stockpileTimes: any = NodeCacheObj.get("stockpileTimes");
    const notifRoles: any = NodeCacheObj.get("notifRoles");
    const prettyName: any = NodeCacheObj.get("prettyName");
    const disableTimeNotif: any = NodeCacheObj.get("disableTimeNotif");
    const stockpileGroups: any = NodeCacheObj.get("stockpileGroups");
    delete stockpileTimes[guildID];
    delete notifRoles[guildID];
    delete prettyName[guildID];
    delete disableTimeNotif[guildID];
    delete stockpileGroups[guildID];
    console.log(
      "Deleted the database and config records of the guild successfully"
    );
  } else
    console.log(
      "Delete request received but no such guildID exists in Storeman Bot records."
    );
};

const createCacheStartup = async (client: Client) => {
  if (process.env.STOCKPILER_MULTI_SERVER === "true") {
    console.log("Storeman bot is running in multi-server mode.");

    const collections = getCollections("global-settings");
    const configObj = await collections.config.findOne();

    // Obtain list of guild IDs from Discord API to check if it matches with the one stored in the DB
    const guildObjs = client.guilds.cache.toJSON();

    let listOfGuildObjs: Guild[] = [];
    let listOfGuildIDs: string[] = [];
    for (let i = 0; i < guildObjs.length; i++) {
      listOfGuildObjs.push(guildObjs[i]);
      listOfGuildIDs.push(guildObjs[i].id);
    }

    if (configObj) {
      // Check if the guildID list has changed since the bot was down
      for (let i = 0; i < listOfGuildObjs.length; i++) {
        const currentID = listOfGuildIDs;
        if (configObj.serverIDList.indexOf(currentID) === -1) {
          // guildID from discord API not found inside our storage, execute createFunction
          guildCreateEventHandler(listOfGuildObjs[i]);
        }
      }
      for (let i = 0; i < configObj.serverIDList.length; i++) {
        const currentID = configObj.serverIDList[i];
        if (listOfGuildIDs.indexOf(currentID) === -1) {
          // guildID from our database no longer exists in discord API, execute destroyFunction
          guildDeleteEventHandler(currentID);
        }
      }

      if (configObj.version < currentVersion) {
        // Update all the commands since the version has changed
        for (let i = 0; i < configObj.serverIDList.length; i++) {
          insertCommands(configObj.serverIDList[i]);
          await collections.config.updateOne(
            {},
            { $set: { version: currentVersion } }
          );
        }
      }

      let notifRoles: any = {};
      let prettyName: any = {};
      let stockpileTimes: any = {};
      let disableTimeNotif: any = {};
      let stockpileGroups: any = {};
      for (let i = 0; i < configObj.serverIDList.length; i++) {
        // Create custom notifRoles and prettyNames cache object
        const serverCollections = getCollections(configObj.serverIDList[i]);
        const serverConfigObj = await serverCollections.config.findOne({});
        if ("notifRoles" in serverConfigObj)
          notifRoles[configObj.serverIDList[i]] = serverConfigObj.notifRoles;
        else notifRoles[configObj.serverIDList[i]] = [];
        if ("prettyName" in serverConfigObj)
          prettyName[configObj.serverIDList[i]] = serverConfigObj.prettyName;
        else prettyName[configObj.serverIDList[i]] = {};

        // Create the disable time cache object
        if ("disableTimeNotif" in serverConfigObj)
          disableTimeNotif[configObj.serverIDList[i]] =
            serverConfigObj.disableTimeNotif;
        else disableTimeNotif[configObj.serverIDList[i]] = false;

        if ("stockpileGroups" in serverConfigObj)
          stockpileGroups[configObj.serverIDList[i]] =
            serverConfigObj.stockpileGroups;
        else stockpileGroups[configObj.serverIDList[i]] = {};

        const stockpiles = await serverCollections.stockpiles
          .find({})
          .toArray();
        stockpileTimes[configObj.serverIDList[i]] = {};
        for (let y = 0; y < stockpiles.length; y++) {
          if ("timeLeft" in stockpiles[y]) {
            let timeNotificationLeft = timerBP.length - 1;
            for (let x = 0; x < timerBP.length; x++) {
              const timeLeftProperty: any = stockpiles[y].timeLeft;
              const currentDate: any = new Date();
              if ((timeLeftProperty - currentDate) / 1000 <= timerBP[x]) {
                timeNotificationLeft = x;
                break;
              }
            }
            if (timeNotificationLeft >= 1) timeNotificationLeft -= 1;
            stockpileTimes[configObj.serverIDList[i]][stockpiles[y].name] = {
              timeLeft: stockpiles[y].timeLeft,
              timeNotificationLeft: timeNotificationLeft,
            };
          }
        }
      }

      NodeCacheObj.set("notifRoles", notifRoles);
      NodeCacheObj.set("prettyName", prettyName);
      NodeCacheObj.set("stockpileTimes", stockpileTimes);
      NodeCacheObj.set("disableTimeNotif", disableTimeNotif);
      NodeCacheObj.set("stockpileGroups", stockpileGroups);
    } else {
      for (let i = 0; i < listOfGuildObjs.length; i++) {
        guildCreateEventHandler(listOfGuildObjs[i]);
      }
      await collections.config.insertOne({
        version: currentVersion,
        serverIDList: listOfGuildIDs,
      });
    }

    client.on("guildCreate", (guild) => {
      guildCreateEventHandler(guild);
    });

    client.on("guildDelete", (guild) => {
      guildDeleteEventHandler(guild.id);
    });
  } else {
    // Create list of timeLefts till the stockpile expires
    const collections = getCollections();

    const stockpiles = await collections.stockpiles.find({}).toArray();
    let stockpileTime: any = {};
    for (let i = 0; i < stockpiles.length; i++) {
      if ("timeLeft" in stockpiles[i]) {
        let timeNotificationLeft = timerBP.length - 1;
        for (let x = 0; x < timerBP.length; x++) {
          const timeLeftProperty: any = stockpiles[i].timeLeft;
          const currentDate: any = new Date();
          if ((timeLeftProperty - currentDate) / 1000 <= timerBP[x]) {
            timeNotificationLeft = x;
            break;
          }
        }
        if (timeNotificationLeft >= 1) timeNotificationLeft -= 1;
        stockpileTime[stockpiles[i].name] = {
          timeLeft: stockpiles[i].timeLeft,
          timeNotificationLeft: timeNotificationLeft,
        };
      }
    }
    NodeCacheObj.set("stockpileTimes", stockpileTime);

    // Check whether to insert commands and do first-time setup
    if (process.env.NODE_ENV === "development") insertCommands();
    const configOptions = await collections.config.findOne({}, {});
    if (configOptions) {
      let notifRoles = [];
      if ("notifRoles" in configOptions) notifRoles = configOptions.notifRoles;
      NodeCacheObj.set("notifRoles", notifRoles);
      let prettyName: any = {};
      let disableTimeNotif: any = false;
      if ("prettyName" in configOptions) prettyName = configOptions.prettyName;
      NodeCacheObj.set("prettyName", prettyName);
      if ("disableTimeNotif" in configOptions)
        disableTimeNotif = configOptions.disableTimeNotif;
      NodeCacheObj.set("disableTimeNotif", disableTimeNotif);

      let stockpileGroups: any = {};
      if ("stockpileGroups" in configOptions)
        stockpileGroups = configOptions.stockpileGroups;
      NodeCacheObj.set("stockpileGroups", stockpileGroups);

      if (configOptions.version) {
        if (configOptions.version < currentVersion) updateFirstTimeSetup(false);
      } else updateFirstTimeSetup(true);
    } else updateFirstTimeSetup(true);
  }
};

const main = async (): Promise<void> => {
  let commandCallQueue: Array<Interaction> = [];
  let multiServerCommandQueue: any = {};

  const handleCommand = async (interaction: Interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        const commandName = interaction.commandName;
        const commandMapResult = commandMapping[commandName];
        if (!commandMapResult) {
          await interaction.editReply({
            content:
              "This command has been removed. Discord might not have invalidated this old command ;c",
          });
          return false;
        }
        if (commandMapResult.sub) {
          const subMapResult =
            commandMapResult.handler[interaction.options.getSubcommand()];
          if (subMapResult.vars === 2)
            await subMapResult.func(interaction, client);
          else await subMapResult.func(interaction);
        } else {
          if (commandMapResult.vars === 2)
            await commandMapResult.handler(interaction, client);
          else await commandMapResult.handler(interaction);
        }
      } else if (interaction.isButton()) {
        await buttonHandler(interaction);
      } else if (interaction.isAutocomplete()) {
        await autoCompleteHandler(interaction);
      }
    } catch (e) {
      if (interaction.isChatInputCommand() || interaction.isButton()) {
        let errorDump = JSON.stringify(e, Object.getOwnPropertyNames(e));
        if (interaction.isChatInputCommand()) {
          console.log(
            "[!!!]: An error has occured in the command " +
              interaction.commandName +
              ". Please kindly report this to the developer on Discord (Tkai#8276)"
          );
          interaction.followUp({
            content:
              "[❗❗❗] An error has occurred in Storeman Bot for the command `" +
              interaction.commandName +
              "`. Please kindly send the logs below this message to the developer on Discord at Tkai#8276",
            ephemeral: true,
          });
        } else if (interaction.isButton()) {
          console.log(
            "[!!!]: An error has occured in a button action. Please kindly report this to the developer on Discord (Tkai#8276)"
          );
          interaction.followUp({
            content:
              "[❗❗❗] An error has occurred in Storeman Bot button action. Please kindly send logs below this message to the developer on Discord at Tkai#8276.",
            ephemeral: true,
          });
        }
        while (errorDump.length > 0) {
          if (errorDump.length > 2000) {
            const sliced = errorDump.slice(0, 2000);
            const lastEnd = sliced.lastIndexOf("\n");
            const finalMsg = sliced.slice(0, lastEnd);

            await interaction.followUp({
              content: finalMsg,
              ephemeral: true,
            });
            errorDump = errorDump.slice(lastEnd, errorDump.length);
          } else {
            await interaction.followUp({
              content: errorDump,
              ephemeral: true,
            });
            errorDump = "";
          }
        }
      }
    }

    if (process.env.STOCKPILER_MULTI_SERVER === "true") {
      multiServerCommandQueue[interaction.guildId!].splice(0, 1);
      if (multiServerCommandQueue[interaction.guildId!].length > 0) {
        handleCommand(multiServerCommandQueue[interaction.guildId!][0]);
      }
      console.log(
        "[Command Queue:] Finished 1 command for " +
          interaction.guildId +
          ". Remaining length of queue: " +
          multiServerCommandQueue[interaction.guildId!].length
      );
    } else {
      commandCallQueue.splice(0, 1);
      if (commandCallQueue.length > 0) {
        handleCommand(commandCallQueue[0]);
      }
      console.log(
        "[Command Queue:] Finished 1 command. Remaining length of queue: " +
          commandCallQueue.length
      );
    }
  };

  // Create a new client instance
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  global.NodeCacheObj = new NodeCache({ checkperiod: 0, useClones: false });
  const csvData: Array<any> = await new Promise(function (resolve, reject) {
    let fetchData: any = [];
    fs.createReadStream("ItemNumbering.csv")
      .pipe(csv())
      .on("data", (row) => {
        fetchData.push(row);
      })
      .on("end", () => {
        console.log("Item List CSV file successfully processed");
        resolve(fetchData);
      })
      .on("error", reject);
  });
  let itemList: String[] = [];
  let listWithCrates: String[] = [];
  let itemListBoth: String[] = [];
  let lowerToOriginal: any = {};
  let itemListCategoryMapping: any = {};

  for (let i = 0; i < csvData.length; i++) {
    const loweredName = csvData[i].Name.slice()
      .replace(/\./g, "_")
      .toLowerCase();
    itemList.push(loweredName);
    listWithCrates.push(loweredName + " crate");
    itemListBoth.push(loweredName);
    itemListBoth.push(loweredName + " crate");
    lowerToOriginal[loweredName] = csvData[i].Name;
    lowerToOriginal[loweredName + " crate"] = csvData[i].Name + " crate";

    if (csvData[i].StockpileCategory === "Vehicle") {
      itemListCategoryMapping[loweredName] = csvData[i].StockpileCategory;
      itemListCategoryMapping[loweredName + " crate"] =
        csvData[i].StockpileCategory + " Crate";
    } else {
      itemListCategoryMapping[loweredName] = csvData[i].StockpileCategory;
      itemListCategoryMapping[loweredName + " crate"] =
        csvData[i].StockpileCategory;
    }
  }

  const LocationCSV: Array<any> = await new Promise(function (resolve, reject) {
    let fetchData: any = [];
    fs.createReadStream("Locs.csv")
      .pipe(csv())
      .on("data", (row) => {
        fetchData.push(row);
      })
      .on("end", () => {
        console.log("Location CSV file successfully processed");
        resolve(fetchData);
      })
      .on("error", reject);
  });
  let locationMappings: any = {};
  for (let i = 0; i < LocationCSV.length; i++) {
    locationMappings[LocationCSV[i].Code.toLowerCase()] =
      LocationCSV[i].Translation;
  }

  NodeCacheObj.set("itemList", itemList);
  NodeCacheObj.set("itemListBoth", itemListBoth);
  NodeCacheObj.set("listWithCrates", listWithCrates);
  NodeCacheObj.set("lowerToOriginal", lowerToOriginal);
  NodeCacheObj.set("itemListCategoryMapping", itemListCategoryMapping);
  NodeCacheObj.set("locationMappings", locationMappings);

  NodeCacheObj.set("timerBP", timerBP);

  // Connect to mongoDB
  if (await open()) {
    setInterval(checkTimeNotifs, 1000 * 60, client, false, true);

    // Start HTTP server
    const server = http.createServer((request, response) => {
      if (request.method === "POST") {
        let body = "";
        request.on("data", (data) => {
          body += data;
        });
        request.on("end", async () => {
          try {
            await stockpilerUpdateStockpile(client, JSON.parse(body), response);
          } catch (e) {
            response.writeHead(403, { "Content-Type": "application/json" });
            response.end(
              JSON.stringify({ success: false, error: "invalid-json" })
            );
          }
        });
      } else if (request.method === "GET") {
        response.writeHead(200, { "Content-Type": "text/html" });
        response.write(`
                    <html>
                        <h1>Storeman Bot</h1>
                        <p>If you are seeing this page, it means you have reached the Storeman Bot sanity check web page. Please use the <a href="https://github.com/tehruttiger/Stockpiler">Stockpiler</a> app to communicate with our servers instead!</p>
                    </html>
                `);
        response.end();
      }
    });

    server.listen(parseInt(process.env.APP_PORT!), host);
    console.log(
      `HTTP server now listening at http://${host}:${process.env.APP_PORT}`
    );

    // This is called once client(the bot) is ready
    client.once("ready", async () => {
      await createCacheStartup(client);
      console.log("Storeman Bot is ready!");
      client.user?.setActivity("/sphelp");
    });

    client.on("interactionCreate", async (interaction) => {
      if (interaction.isChatInputCommand()) {
        await interaction.reply({
          content: "Working on it...",
          ephemeral: true,
        });
      } else if (interaction.isButton()) {
        await interaction.update({
          content: "Working on it...",
          components: [],
        });
      }
      if (process.env.STOCKPILER_MULTI_SERVER === "true") {
        if (!(interaction.guildId! in multiServerCommandQueue)) {
          multiServerCommandQueue[interaction.guildId!] = [interaction];
        } else {
          multiServerCommandQueue[interaction.guildId!].push(interaction);
        }

        if (multiServerCommandQueue[interaction.guildId!].length === 1) {
          console.log(
            `[Command Queue:] No queue ahead for ${interaction.guildId}, starting.`
          );
          handleCommand(multiServerCommandQueue[interaction.guildId!][0]);
        }
      } else {
        commandCallQueue.push(interaction);
        if (commandCallQueue.length === 1) {
          console.log("[Command Queue:] No queue ahead, starting.");
          handleCommand(commandCallQueue[0]);
          // kick start the queue
        }
      }
    });

    // Connect by logging into Discord
    client.login(process.env.STOCKPILER_TOKEN);
  } else {
    console.error("Failed to connect to MongoDB. Exiting now");
  }
};

main();
