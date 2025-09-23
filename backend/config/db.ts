import mongose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export const connectDB = async () => {
  try {
    const conn = await mongose.connect(process.env.MONGO_URI!);
    console.log(
      `======================MongoDB Connected 🚀🚀🚀🚀======================`
    );

  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
