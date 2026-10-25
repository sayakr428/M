// Shared MongoDB connection, reused across warm function invocations.
import { MongoClient } from "mongodb";

let clientPromise = null;

export async function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured");
  if (!clientPromise) {
    clientPromise = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 })
      .connect()
      .catch((err) => {
        clientPromise = null;
        throw err;
      });
  }
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB || "shantiban");
}

export function respond(status, body, headers = {}) {
  const isText = typeof body === "string";
  return new Response(isText ? body : JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": isText ? "text/plain; charset=utf-8" : "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}
