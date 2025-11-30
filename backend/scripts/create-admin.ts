import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import adminModel from "../models/adminSchema";
import AuthFeatures from "../services/auth";

// Load environment variables - resolve from the scripts directory
const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath });

class CreateAdminScript extends AuthFeatures {
  async createAdmin() {
    try {
      // Connect to database
      if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI environment variable is not defined!");
      }

      console.log("🔌 Connecting to MongoDB...");
      const options = {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        maxPoolSize: 10,
        minPoolSize: 5,
        retryWrites: true,
        w: 'majority' as const,
      };
      await mongoose.connect(process.env.MONGO_URI, options);
      console.log("✅ Connected to MongoDB\n");

      // Get admin details from command line arguments or use defaults
      const args = process.argv.slice(2);
      const firstName = args[0] || "Admin";
      const email = args[1] || "admin@example.com";
      const password = args[2] || "admin123";
      const role = args[3] || "admin";

      // Check if admin already exists
      const existingAdmin = await adminModel.findOne({ email });
      if (existingAdmin) {
        console.log(`❌ Admin with email "${email}" already exists!`);
        console.log("   Use a different email or delete the existing admin first.\n");
        await mongoose.connection.close();
        process.exit(1);
      }

      // Hash the password
      const hashedPassword = this.GenerateHash(password);

      // Create new admin
      const newAdmin = await adminModel.create({
        firstName,
        email,
        password: hashedPassword,
        role,
      });

      console.log("✅ Admin user created successfully!\n");
      console.log("📋 Admin Details:");
      console.log(`   Name: ${newAdmin.firstName}`);
      console.log(`   Email: ${newAdmin.email}`);
      console.log(`   Role: ${newAdmin.role}`);
      console.log(`   ID: ${newAdmin._id}\n`);
      console.log("🔐 Login Credentials:");
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}\n`);
      console.log("⚠️  Please change the password after first login!\n");

      // Close database connection
      await mongoose.connection.close();
      console.log("✅ Database connection closed");
      process.exit(0);
    } catch (error: any) {
      console.error("❌ Error creating admin:", error.message);
      if (error.code === 11000) {
        console.error("   Duplicate email detected. Admin with this email already exists.");
      }
      await mongoose.connection.close();
      process.exit(1);
    }
  }
}

// Run the script
const script = new CreateAdminScript();
script.createAdmin();

