import "dotenv/config";
import mongoose from "mongoose";

const testConnection = async () => {
    try {
        console.log("Attempting to connect to MongoDB...");
        const start = performance.now();
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
            family: 4
        });
        const end = performance.now();
        console.log(`Connected successfully in ${((end - start) / 1000).toFixed(2)} seconds!`);
        process.exit(0);
    } catch (error) {
        console.error("Connection failed:", error.message);
        process.exit(1);
    }
};

testConnection();
