const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../models/User');

const cleanAllUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🗄️ Connected to MongoDB');
    
    const deleteResult = await User.deleteMany({});
    console.log(`🗑️ Deleted ALL ${deleteResult.deletedCount} users`);
    
    console.log('✅ Database is now clean');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

cleanAllUsers();