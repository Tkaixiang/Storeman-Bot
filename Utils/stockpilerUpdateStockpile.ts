import { Client } from "discord.js";
import argon2 from 'argon2';
import { getCollections } from './../mongoDB'
import http from 'http'
import generateStockpileMsg from "./generateStockpileMsg";
import updateStockpileMsg from "./updateStockpileMsg";
import mongoSanitize from 'express-mongo-sanitize';
let queue: Array<any> = []
let multiServerQueue: any = {}
const eventName = "[Stockpiler Update Event]: "

const stockpilerUpdateStockpileEntryPoint = async (client: Client, body: any, response: http.ServerResponse) => {
    if (process.env.STOCKPILER_MULTI_SERVER === "true") {
        if (!body.guildID) {
            response.writeHead(404, { 'Content-Type': 'application/json' })
            response.end(JSON.stringify({ success: false, error: "empty-guild-id" }))
            return false
        }
        if (!(body.guildID in multiServerQueue)) multiServerQueue[body.guildID] = []

        multiServerQueue[body.guildID].push({ client: client, body: body, response: response })

        if (multiServerQueue[body.guildID].length === 1) {
            console.log(eventName + "No queue ahead. Starting")
            stockpilerUpdateStockpile(multiServerQueue[body.guildID][0].client, multiServerQueue[body.guildID][0].body, multiServerQueue[body.guildID][0].response)
        }
        else {
            console.log(eventName + "Update event queued, current length in queue: " + multiServerQueue[body.guildID].length)
        }
    }
    else {
        queue.push({ client: client, body: body, response: response })

        if (queue.length === 1) {
            console.log(eventName + "No queue ahead. Starting")
            stockpilerUpdateStockpile(queue[0].client, queue[0].body, queue[0].response)
        }
        else {
            console.log(eventName + "Update event queued, current length in queue: " + queue.length)
        }
    }


    return true
}

const stockpilerUpdateStockpile = async (client: Client, body: any, response: http.ServerResponse) => {
    try {
        const collections = process.env.STOCKPILER_MULTI_SERVER === "true" ? getCollections(body.guildID) : getCollections()
        const password = await collections.config.findOne({}, { projection: { password: 1 } })
        if (process.env.STOCKPILER_MULTI_SERVER === "true" && !password) {
            console.log(eventName + "No GuildID was found with guildID: " + body.guildID)
            response.writeHead(404, { 'Content-Type': 'application/json' })
            response.end(JSON.stringify({ success: false, error: "invalid-guild-id" }))
            return false
        }
        if (await argon2.verify(password.password, body.password)) {
            console.log(eventName + "Password Verified, starting update request")
            if (body.name === "") {
                response.writeHead(403, { 'Content-Type': 'application/json' })
                response.end(JSON.stringify({ success: false, error: "empty-stockpile-name" }))
                console.log(eventName + "Empty stockpile name received, exiting")
            }
            else {
                const cleanName = body.name.replace(/\./g, "").replace(/\$/g, "")
                const stockpile = await collections.stockpiles.findOne({ name: cleanName })
                const currentDate = new Date()


                if (stockpile) {
                    const newStockpileItems: any = {}
                    for (let i = 0; i < body.data.length; i++) {
                        const amount = parseInt(body.data[i][1])
                        if (amount !== 0) newStockpileItems[body.data[i][0].toLowerCase()] = parseInt(body.data[i][1])
                    }
                    mongoSanitize.sanitize(newStockpileItems, {
                        replaceWith: '_'
                    });

                    if (JSON.stringify(newStockpileItems) !== JSON.stringify(stockpile.items)) {
                        // There was a change in the stockpile items. Hence that means the stockpile timer was refreshed sometime inbetween the last scan and the current scan
                        console.log(eventName + "There was a change in the stockpile items. Updating possible expiry range.")

                        // Check if  higher expiry bound exists, if not, try to insert one
                        if ("upperBound" in stockpile) {
                            // If it comes to here, no one has pressed the "Refresh Timer" button between the last scan and the current scan
                            // This is cause the "Refresh Timer" button removes the "upperBound" indicator as it is an absolute timing and we should ignore any upper bounds and stuff
                            // Hence, the "lastUpdated" (the last scan timing) in this case is the absolute lower bound and there is no other time left between the lower bound and the current bound

                            const stockpileTimesObj: any = NodeCacheObj.get("stockpileTimes")
                            let stockpileTimes: any = {}
                            if (process.env.STOCKPILER_MULTI_SERVER === "true") stockpileTimes = stockpileTimesObj[body.guildID]
                            else stockpileTimes = stockpileTimesObj

                            const timerBP: any = NodeCacheObj.get("timerBP")
                            let newTimeLeft = new Date(stockpile.lastUpdated.getTime() + 60 * 60 * 1000 * 48)
                            let timeNotificationLeft = 4
                            for (let x = 0; x < timerBP.length; x++) {
                                const timeLeftProperty: any = newTimeLeft
                                const currentDate: any = new Date()
                                if (((timeLeftProperty - currentDate) / 1000) <= timerBP[x]) {
                                    timeNotificationLeft = x
                                    break
                                }
                            }
                            stockpileTimes[cleanName] = { timeLeft: newTimeLeft, timeNotificationLeft: timeNotificationLeft }
                            await collections.stockpiles.updateOne({ name: cleanName }, { $set: { items: newStockpileItems, lastUpdated: currentDate, timeLeft: newTimeLeft, upperBound: new Date((new Date()).getTime() + 60 * 60 * 1000 * 48) } })
                            console.log(eventName + "upperBound exists. Modifying stockpiler timer based on last scan timing")
                        }
                        else {
                            let newTimeLeft: any;
                            const stockpileTimesObj: any = NodeCacheObj.get("stockpileTimes")
                            let stockpileTimes: any;
                            if (process.env.STOCKPILER_MULTI_SERVER === "true") stockpileTimes = stockpileTimesObj[body.guildID]
                            else stockpileTimes = stockpileTimesObj
                            const timerBP: any = NodeCacheObj.get("timerBP")


                            if ("timeLeft" in stockpile) newTimeLeft = stockpile.timeLeft
                            else newTimeLeft = new Date(stockpile.lastUpdated.getTime() + 60 * 60 * 1000 * 48)

                            let timeNotificationLeft = 4
                            for (let x = 0; x < timerBP.length; x++) {
                                const timeLeftProperty: any = newTimeLeft
                                const currentDate: any = new Date()
                                if (((timeLeftProperty - currentDate) / 1000) <= timerBP[x]) {
                                    timeNotificationLeft = x
                                    break
                                }
                            }
                            stockpileTimes[cleanName] = { timeLeft: newTimeLeft, timeNotificationLeft: timeNotificationLeft }

                            await collections.stockpiles.updateOne({ name: cleanName }, { $set: { items: newStockpileItems, lastUpdated: currentDate, timeLeft: newTimeLeft, upperBound: new Date((new Date()).getTime() + 60 * 60 * 1000 * 48) } })
                            console.log(eventName + "upperBound does not exist. Modifying stockpiler timer based on last updated timing or last scan timing")
                        }
                    }
                    else {
                        // No change, just update the scan time and all
                        await collections.stockpiles.updateOne({ name: cleanName }, { $set: { items: newStockpileItems, lastUpdated: currentDate } })
                    }
                    console.log(eventName + "Stockpile " + cleanName + " updated via Stockpiler at " + currentDate.toUTCString())

                }
                else {
                    console.log(eventName + 'New stockpile: ' + cleanName + ' added.')
                    let newItems: any = {}
                    for (let i = 0; i < body.data.length; i++) {
                        const amount = parseInt(body.data[i][1])
                        if (amount !== 0) newItems[body.data[i][0].toLowerCase()] = parseInt(body.data[i][1])
                    }
                    mongoSanitize.sanitize(newItems, { replaceWith: '_' });
                    await collections.stockpiles.insertOne({ name: cleanName, items: newItems, lastUpdated: currentDate })
                    await collections.config.updateOne({}, { $push: { orderSettings: cleanName } })
                    console.log(eventName + "Stockpile " + cleanName + " updated via Stockpiler at " + currentDate.toUTCString())
                }

                const guildID = process.env.STOCKPILER_MULTI_SERVER === "true" ? body.guildID : "GUILD_ID_PLACEHOLDER"
                const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader] = await generateStockpileMsg(true, guildID)
                await updateStockpileMsg(client, guildID, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader])

                response.writeHead(200, { 'Content-Type': 'application/json' })
                response.end(JSON.stringify({ success: true }))
            }
        }
        else {
            console.log(eventName + "Invalid password received")
            response.writeHead(403, { 'Content-Type': 'application/json' })
            response.end(JSON.stringify({ success: false, error: "invalid-password" }))
        }

        if (process.env.STOCKPILER_MULTI_SERVER === "true") {
            multiServerQueue[body.guildID].splice(0, 1)
            if (queue.length > 0) {
                console.log(eventName + "Finished 1 update event for GuildID: " + body.guildID + ". starting next update in queue, remaining queue: " + multiServerQueue[body.guildID].length)
                stockpilerUpdateStockpile(multiServerQueue[body.guildID][0].client, multiServerQueue[body.guildID][0].body, multiServerQueue[body.guildID][0].response)
            }
        }
        else {
            queue.splice(0, 1)
            if (queue.length > 0) {
                console.log(eventName + "Finished 1 update event, starting next update in queue, remaining queue: " + queue.length)
                stockpilerUpdateStockpile(queue[0].client, queue[0].body, queue[0].response)
            }
        }

        return true
    }
    catch (e) {
        console.log(eventName + "An error occured while processing a request for guild: " + body.guildID)
        console.log(e)
        response.writeHead(500, { 'Content-Type': 'application/json' })
        response.end(JSON.stringify({ success: false, error: "storeman-bot-error-occured" }))
    }


}

export default stockpilerUpdateStockpileEntryPoint
