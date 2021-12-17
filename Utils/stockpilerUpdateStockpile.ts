import { Client } from "discord.js";
import argon2 from 'argon2';
import { getCollections } from './../mongoDB'
import http from 'http'
import generateStockpileMsg from "./generateStockpileMsg";
import updateStockpileMsg from "./updateStockpileMsg";

const stockpilerUpdateStockpile = async (client: Client, body: any, response: http.ServerResponse) => {
    const collections = getCollections()
    const password = (await collections.config.findOne({}, {projection: {password: 1}}))!
    if (await argon2.verify(password.password, body.password)) {
        if (body.name === "") {
            response.writeHead(403, { 'Content-Type': 'application/json' })
            response.end(JSON.stringify({ success: false, error: "empty-stockpile-name" }))
            return false
        }

        const stockpile = await collections.stockpiles.findOne({name: body.name})
        if (stockpile) {
            for (let i = 0; i < body.data.length; i++) {
                stockpile.items[body.data[i][0]] = parseInt(body.data[i][1])
            }
            await collections.stockpiles.updateOne({ name: body.name }, { $set: { items: stockpile.items, lastUpdated: new Date() } })
        }
        else {
            let newItems: any = {}
            for (let i = 0; i < body.data.length; i++) {
                newItems[body.data[i][0]] = parseInt(body.data[i][1])
            }
            await collections.stockpiles.insertOne({ name: body.name, items: newItems, lastUpdated: new Date() })
        }

        const [stockpileHeader, stockpileMsgs, targetMsg] = await generateStockpileMsg(true)
        await updateStockpileMsg(client, [stockpileHeader, stockpileMsgs, targetMsg])
       
        response.writeHead(200, { 'Content-Type': 'application/json' })
        response.end(JSON.stringify({ success: true }))
        return true

    }
    else {
        response.writeHead(403, { 'Content-Type': 'application/json' })
        response.end(JSON.stringify({ success: false, error: "invalid-password" }))
        return false
    }
}

export default stockpilerUpdateStockpile