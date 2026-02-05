import mongoose from "mongoose";

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected || mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable");
  }

  await mongoose.connect(uri);
  isConnected = true;
  return mongoose;
}