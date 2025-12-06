const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('🧪 Testing MongoDB Connection...\n');

const connectDB = async () => {
  try {
    console.log('📍 Environment Variables:');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    console.log(`   MongoDB URI: ${process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 30) + '...' : 'NOT SET'}\n`);

    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in .env file');
    }

    console.log('🔌 Attempting MongoDB Atlas connection...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    });

    console.log(`✅ Successfully connected to MongoDB!`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`   Ready State: ${mongoose.connection.readyState} (1 = connected)\n`);

    // Test ping
    try {
      await mongoose.connection.db.admin().ping();
      console.log('✅ Database ping successful!\n');
    } catch (pingError) {
      console.warn('⚠️  Database ping failed:', pingError.message, '\n');
    }

    console.log('🎉 MongoDB connection is configured correctly!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: npm run dev (to start the development server)');
    console.log('   2. The backend API will be available at http://localhost:5000');
    console.log('   3. All data will be stored in MongoDB\n');

    await mongoose.disconnect();
    console.log('✅ Test connection closed successfully\n');

  } catch (error) {
    console.error('❌ Connection Error:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Verify your MongoDB credentials in .env file');
    console.error('   2. Check that your MongoDB cluster is active');
    console.error('   3. Ensure your IP is whitelisted in MongoDB Atlas');
    console.error('   4. Check your internet connection\n');
    process.exit(1);
  }
};

connectDB();
