import { Db, MongoClient, Collection, WithId } from 'mongodb'
let db: Db
interface collectionList {
    stockpiles: Collection,
    targets: Collection,
    config: Collection
}
let collections: collectionList;


const open = async (): Promise<boolean> => {
    const status = await MongoClient.connect("mongodb://localhost:27017", {
    }).then(async (client) => {
        const db = client.db('stockpiler')
        collections = {
            stockpiles: db.collection('stockpiles'),
            targets: db.collection('targets'),
            config: db.collection('config')
        }

        console.info("MongoDB connected successfully!")
        return true
    }).catch((error) => {
        console.error(error)
        console.error("Error connecting to MongoDB")
        return false
    })
    return status
}

const getDB = () => {
    return db
}

const getCollections = () => {
    return collections
}


export { open, getDB, getCollections }
