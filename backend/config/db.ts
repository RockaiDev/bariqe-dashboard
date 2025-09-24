import mongose from "mongoose";

export const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is not defined!");
    }
    
    const conn = await mongose.connect(process.env.MONGO_URI);
    console.log(
      `======================MongoDB Connected 🚀🚀🚀🚀======================`
    );

  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};
