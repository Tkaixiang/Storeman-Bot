# Storeman Bot - The Foxhole Stockpile Discord Companion Bot

## What is this?

This is a companion bot to the amazing Foxhole [Stockpiler](https://github.com/tehruttiger/Stockpiler/tree/master) app that uses image recognition to scan for stockpile items.

This bot takes information from the Stockpiler's `"Send to Bot"` feature when scanning a stockpile and saves it into a MongoDB database to be displayed in a Discord server.

Gone are the days of QM-Teams manually inputting amounts using eye-power into spreadsheets to update their regiment stockpiles. With the simple press of `F3` on the Stockpiler app to scan any stockpile, the data is sent automatically to the bot and it updates a text channel with the latest info.

## Features

- HTTP Server to **receive data** from the Stockpiler App and MongoDB to store it
- **Targets** with **minimum** and **maximum** amounts (in crates) for the regiment to meet
- Set a **logi-channel** for the latest targets and stockpile information which is automatically updated whenever a new scan from the Stockpiler app comes in
- Keep track of when reserve stockpiles expire, with a configurable list of roles being reminded when a reserve stockpile is about to expire
- **Roles** (Admin & User) to control the usage of commands between the QM-Team and normal users

### Screenshots

![](screenshots/1.png)

## ![](screenshots/2.png)

## So, how does the process go like?

1. Setup Storeman Bot by following [here](https://github.com/Tkaixiang/Storeman-Bot/wiki/Setting-up-Storeman-Bot)
2. Download the forked version of Stockpiler [here](https://github.com/Tkaixiang/Stockpiler) (I am currently still awaiting approval for the version to be merged into the main Stockpiler branch)
3. Open up Stockpiler and _tick_ the **Send to Bot** option. Inputting the Bot Host & Bot Password. Press the right "`Save`" icon to save your settings.
   - Note: as of writing, there might be a bug with `Learning Mode` inside Stockpiler, if it fails to scan, please _untick_ it as well.
4. Scan any stockpile by hovering over it on the map and pressing `F3`. You should see a "`Sent to server successfully`" inside the console that is opened along with Stockpiler
5. Check back to your set `logi-channel` to see the latest information!

**Note:** Stockpiles should have **!unique names!** since Stockpiler is unable to differentiate stockpiles with the same names in different locations.

## FAQ

1. Why is X broken :c?
   The bot is still in heavy development. Please contact `Tkai#8276` on Discord for any help if it breaks.
2. Is this an X faction specific thing?
   No. It supports both Colonials and Warden items, though I am on Colonials and only tested it there.
3. Why do I need to use my own server to host this bot?
   It is to prevent any intel leaks of stockpile statues to others. I do not believe regiments will trust a central public server to store all their stockpile information, hence each regiment has to host their own.
