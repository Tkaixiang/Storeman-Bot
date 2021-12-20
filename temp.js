import { MongoClient} from 'mongodb';


const status = MongoClient.connect("mongodb://localhost:27017", {
    }).then(async (client) => {
        const db = client.db('stockpiler')
        const collections = {
            stockpiles: db.collection('stockpiles'),
            targets: db.collection('targets'),
            config: db.collection('config')
        }

        let newTargets = {}
        const targetInfo = await collections.targets.findOne({})
        for (const target in targetInfo) {

            if (target !== "_id") {
                newTargets[target] = {min: targetInfo[target], max: 0}
            }
        }
        await collections.targets.updateOne({}, {$set: newTargets})

        console.log("updated")
        return true
    }).catch((error) => {
        console.error(error)
        console.error("Error connecting to MongoDB")
        return false
    })
