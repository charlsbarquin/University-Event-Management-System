const mongoose = require('mongoose');

const connectDB = async () => {
  console.log('🔌 Attempting MongoDB Atlas connection...');
  
  try {
    // Log connection attempt (mask password)
    const maskedURI = process.env.MONGODB_URI.replace(/:[^:@]+@/, ':****@');
    console.log('🔗 Connection string:', maskedURI);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
      maxPoolSize: 10, // Maximum connections
      retryWrites: true,
      w: 'majority'
    });

    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`⚡ Ready State: ${mongoose.connection.readyState} (1 = connected)`);
    
    // Test the connection with a ping
    try {
      await mongoose.connection.db.admin().ping();
      console.log('✅ Database ping successful');
    } catch (pingError) {
      console.warn('⚠️ Database ping failed:', pingError.message);
    }

    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📴 MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔁 MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('👋 MongoDB connection closed due to app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ FATAL: Database connection failed:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check internet connection');
    console.log('2. Verify IP is whitelisted in MongoDB Atlas');
    console.log('3. Check Atlas cluster status: https://status.mongodb.com/');
    console.log('4. Try connecting with MongoDB Compass using same URI');
    console.log('5. Temporarily use local MongoDB: mongodb://localhost:27017/uems_database');
    
    // Suggest temporary local MongoDB
    console.log('\n💡 TEMPORARY FIX: Use local MongoDB for testing:');
    console.log('Edit .env: MONGODB_URI=mongodb://localhost:27017/uems_database');
    console.log('Then run: docker run -d -p 27017:27017 --name uems-mongo mongo');
    
    process.exit(1);
  }
};

module.exports = connectDB;