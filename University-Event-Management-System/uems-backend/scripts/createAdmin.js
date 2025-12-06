const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const User = require('../models/User');

const createAdminOnly = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('🗄️  Connected to MongoDB');

    // Delete only admin users if they exist
    const deleteResult = await User.deleteMany({ 
      $or: [
        { studentId: 'ADMIN001' },
        { role: 'admin' }
      ]
    });
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing admin(s)`);

    // ✅ CRITICAL FIX: Create admin using the User model's password hashing
    // This ensures the password is hashed the same way as regular registration
    const adminUser = new User({
      studentId: 'ADMIN001',
      email: 'admin@bu.edu.ph',
      password: 'admin123', // Will be auto-hashed by User model pre-save hook
      firstName: 'System',
      lastName: 'Administrator',
      gender: 'male',
      role: 'admin'
    });

    // Save the user - this triggers the password hashing in User.js
    await adminUser.save();
    
    console.log('\n✅ ADMIN ACCOUNT CREATED SUCCESSFULLY!');
    console.log('========================================');
    console.log('📋 Admin Credentials:');
    console.log('   Student ID: ADMIN001');
    console.log('   Password: admin123');
    console.log('   Email: admin@bu.edu.ph');
    console.log('   Role: admin');
    console.log('   Gender: male');
    console.log('\n🔐 Password Note:');
    console.log('   Password is hashed using the same method as user registration');
    console.log('   This ensures login will work correctly');
    console.log('\n🎯 To test login:');
    console.log('   1. Go to http://localhost:3000/login');
    console.log('   2. Enter: ADMIN001 / admin123');
    console.log('   3. Should login successfully');
    
    // Verify the admin exists
    const verifyAdmin = await User.findOne({ studentId: 'ADMIN001' });
    console.log('\n🔍 Verification:');
    console.log('   Admin exists:', verifyAdmin ? '✅ Yes' : '❌ No');
    console.log('   Password hash:', verifyAdmin.password.substring(0, 30) + '...');
    
    await mongoose.connection.close();
    console.log('\n🔗 MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

createAdminOnly();