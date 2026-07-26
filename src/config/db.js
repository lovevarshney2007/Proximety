import mongoose from "mongoose";

let cachedConnection = global.mongoose;

if (!cachedConnection) {
  cachedConnection = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  // Serverless fast check: If Mongoose connection is already open, reuse it immediately
  if (mongoose.connection.readyState >= 1 && cachedConnection.conn) {
    return cachedConnection.conn;
  }

  if (cachedConnection.conn) {
    console.log("Using cached MongoDB connection");
    return cachedConnection.conn;
  }

  if (!cachedConnection.promise) {
    const opts = {
      maxPoolSize: 5,                 // M0 free tier ke liye — max 5 connections per serverless instance
      serverSelectionTimeoutMS: 5000, // 5 sec me server nahi mila toh fail karo
      socketTimeoutMS: 45000,         // 45 sec idle connection ko close karo taaki pool free ho
      family: 4,
      bufferCommands: false, 
    };

    cachedConnection.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongooseInstance) => {
      console.log("Newly connected to MongoDB");
      return mongooseInstance;
    });
  }

  try {
    cachedConnection.conn = await cachedConnection.promise;
    return cachedConnection.conn;
  } catch (error) {
    cachedConnection.promise = null;
    console.error("MongoDB connection failed: ", error.message);
    // Don't call process.exit(1) — it crashes serverless/Lambda functions on reconnect attempts
    throw error;
  }
};

export default connectDB;