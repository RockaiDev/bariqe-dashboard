import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is not defined!");
    }

    // MongoDB Atlas connection options
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      connectTimeoutMS: 10000, // Give up initial connection after 10s
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 5, // Maintain at least 5 socket connections
      retryWrites: true,
      w: 'majority' as const,
    };

    const conn = await mongoose.connect(process.env.MONGO_URI, options);
    
    console.log(
      `======================MongoDB Connected 🚀🚀🚀🚀======================`
    );
    console.log(`📦 Database: ${conn.connection.name}`);
    console.log(`🌐 Host: ${conn.connection.host}`);
    console.log(`🔌 Ready State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);

    // =========================================================================
    // AUTO-FIX: Drop problematic unique indexes that cause duplicate key errors
    // =========================================================================
    try {
      const db = conn.connection.db;
      if (db) {
        const collections = await db.listCollections({ name: 'customers' }).toArray();
        if (collections.length > 0) {
          const customersCollection = db.collection('customers');
          const indexes = await customersCollection.indexes();
          
          // Drop customerPhone_1 index if it exists (we don't want unique on phone)
          const phoneIndex = indexes.find((idx: any) => idx.name === 'customerPhone_1');
          if (phoneIndex) {
            console.log('🔧 Dropping obsolete customerPhone_1 index...');
            await customersCollection.dropIndex('customerPhone_1');
            console.log('✅ customerPhone_1 index dropped successfully');
          }
        }
      }
    } catch (indexError: any) {
      // Only warn if it's not a "namespace not found" error
      if (indexError.code !== 26 && indexError.codeName !== 'NamespaceNotFound') {
        console.warn('⚠️ Index cleanup warning:', indexError.message);
      }
    }

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully');
    });

  } catch (error: any) {
    console.error("❌ MongoDB connection error:", error);
    
    // Provide helpful error messages
    if (error.name === 'MongooseServerSelectionError') {
      console.error('\n📋 Troubleshooting Steps:');
      console.error('1. Check if your IP address is whitelisted in MongoDB Atlas:');
      console.error('   - Go to: https://cloud.mongodb.com/');
      console.error('   - Navigate to: Network Access → IP Access List');
      console.error('   - Add your current IP or use 0.0.0.0/0 (for development only)');
      console.error('\n2. Verify your connection string is correct');
      console.error('3. Check if your MongoDB Atlas cluster is running');
      console.error('4. Verify your username and password are correct\n');
    } else if (error.message?.includes('authentication failed')) {
      console.error('\n🔐 Authentication Error:');
      console.error('   - Check your MongoDB username and password');
      console.error('   - Verify the user has proper database access\n');
    }
    
    // Don't exit in development - allow server to start and retry
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn('⚠️ Continuing in development mode. Connection will be retried...');
    }
  }
};
