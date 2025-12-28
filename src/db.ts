import { MongoClient, Db, Collection, ObjectId } from "mongodb";

const uri =
    process.env.MONGO_URI ||
    "mongodb://192.168.30.103:27017,192.168.30.104:27017,192.168.30.105:27017/test?replicaSet=rs0";

let client: MongoClient;
let db: Db;

export let Professors: Collection;
export let Commands: Collection;

export async function connectMongo(): Promise<void> {
    if (db) return;

    client = new MongoClient(uri, {
        retryWrites: true,
        w: "majority",
    });

    await client.connect();

    db = client.db(); // DB aus URI ("test")

    Professors = db.collection("professors");
    Commands = db.collection("commands");

    console.log("Connected to MongoDB Replica Set");
}

export function toObjectId(id: string): ObjectId {
    return new ObjectId(id);
}
