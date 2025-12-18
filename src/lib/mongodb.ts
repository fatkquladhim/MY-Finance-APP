import mongoose from "mongoose";

const uri = process.env.MONGODB_URI as string;

if (!uri) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected || mongoose.connection.readyState === 1) {
    return mongoose;
  }

  await mongoose.connect(uri);
  isConnected = true;
  return mongoose;
}