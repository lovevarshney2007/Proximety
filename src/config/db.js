import mongoose from "mongoose";


let cachedConnection = global.mongoose;

if (!cachedConnection) {
  cachedConnection = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  
  if (cachedConnection.conn) {
    console.log("Using cached MongoDB connection");
    return cachedConnection.conn;
  }

 
  if (!cachedConnection.promise) {
    const opts = {
      family: 4,
      bufferCommands: false, 
    };

    cachedConnection.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongoose) => {
      console.log("Newly connected to MongoDB");
      return mongoose;
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