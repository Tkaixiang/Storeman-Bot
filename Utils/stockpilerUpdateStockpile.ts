import { Client } from "discord.js";
import argon2 from 'argon2';
import { getCollections } from './../mongoDB'
import http from 'http'
import generateStockpileMsg from "./generateStockpileMsg";
import updateStockpileMsg from "./updateStockpileMsg";
import mongoSanitize from 'express-mongo-sanitize';
let queue: Array<any> = []

const stockpilerUpdateStockpileEntryPoint = async (client: Client, body: any, response: http.ServerResponse) => {
    queue.push({ client: client, body: body, response: response })

    if (queue.length === 1) {
        console.log("stockpileUpdateStockpile.ts: No queue ahead. Starting")
        stockpilerUpdateStockpile(queue[0].client, queue[0].body, queue[0].response)
    }
    else {
        console.log("stockpileUpdateStockpile.ts: Update event queued, current length in queue: " + queue.length)
    }

    return true
}

const stockpilerUpdateStockpile = async (client: Client, body: any, response: http.ServerResponse) => {
    const collections = getCollections()
    const password = (await collections.config.findOne({}, { projection: { password: 1 } }))!
    if (await argon2.verify(password.password, body.password)) {
        if (body.name === "") {
            response.writeHead(403, { 'Content-Type': 'application/json' })
            response.end(JSON.stringify({ success: false, error: "empty-stockpile-name" }))
            return false
        }

        const stockpile = await collections.stockpiles.findOne({ name: body.name })
        if (stockpile) {
            const newStockpileItems: any = {}
            for (let i = 0; i < body.data.length; i++) {
                const amount = parseInt(body.data[i][1])
                if (amount !== 0) newStockpileItems[body.data[i][0].toLowerCase()] = parseInt(body.data[i][1])
            }
            mongoSanitize.sanitize(newStockpileItems, {
                replaceWith: '_'
            });
            await collections.stockpiles.updateOne({ name: body.name.replace(/\./g, "").replace(/\$/g, "") }, { $set: { items: newStockpileItems, lastUpdated: new Date() } })
        }
        else {
            console.log('New stockpile: ' + body.name + ' added.')
            let newItems: any = {}
            for (let i = 0; i < body.data.length; i++) {
                newItems[body.data[i][0].toLowerCase()] = parseInt(body.data[i][1])
            }
            mongoSanitize.sanitize(newItems, { replaceWith: '_' });
            await collections.stockpiles.insertOne({ name: body.name.replace(/\./g, "").replace(/\$/g, ""), items: newItems, lastUpdated: new Date() })
            await collections.config.updateOne({}, { $push: { orderSettings: body.name.replace(/\./g, "").replace(/\$/g, "") } })
        }

        const [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader] = await generateStockpileMsg(true)
        await updateStockpileMsg(client, [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader])

        response.writeHead(200, { 'Content-Type': 'application/json' })
        response.end(JSON.stringify({ success: true }))
    }
    else {
        response.writeHead(403, { 'Content-Type': 'application/json' })
        response.end(JSON.stringify({ success: false, error: "invalid-password" }))
    }

    queue.splice(0, 1)
    if (queue.length > 0) {
        console.log("stockpileUpdateStockpile.ts: Finished 1, starting next in queue, remaining queue: " + queue.length)
        stockpilerUpdateStockpile(queue[0].client, queue[0].body, queue[0].response)
    }

    return true


}

export default stockpilerUpdateStockpileEntryPoint
