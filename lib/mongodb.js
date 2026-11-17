import { MongoClient } from "mongodb";

export async function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  if (!globalThis._mongoClientPromise) {
    globalThis._mongoClientPromise = new MongoClient(uri, { maxPoolSize: 5 })
      .connect()
      .catch((err) => {
        globalThis._mongoClientPromise = null;
        throw err;
      });
  }
  const client = await globalThis._mongoClientPromise;
  return client.db(process.env.MONGODB_DATABASE || "parking_management");
}
