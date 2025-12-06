const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://uems_app_user:SecurePass123!@cluster0.dya7caz.mongodb.net/uems_database?retryWrites=true&w=majority';

const checkUsers = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const User = require('./models/User');
    
    // Check if demo users exist
    const adminUser = await User.findOne({ studentId: 'ADMIN001' });
    const orgUser = await User.findOne({ studentId: 'ORG001' });
    const stuUser = await User.findOne({ studentId: 'STU001' });
    
    console.log('📋 User Status:');
    console.log('ADMIN001:', adminUser ? `✅ Found (role: ${adminUser.role})` : '❌ Not found');
    console.log('ORG001:', orgUser ? `✅ Found (role: ${orgUser.role})` : '❌ Not found');
    console.log('STU001:', stuUser ? `✅ Found (role: ${stuUser.role})` : '❌ Not found');
    
    // If admin exists, show details and test password
    if (adminUser) {
      console.log('\n👤 Admin User Details:');
      console.log('Student ID:', adminUser.studentId);
      console.log('Email:', adminUser.email);
      console.log('Role:', adminUser.role);
      console.log('First Name:', adminUser.firstName || 'NOT SET');
      console.log('Last Name:', adminUser.lastName || 'NOT SET');
      console.log('Gender:', adminUser.gender || 'NOT SET');
      console.log('Is Active:', adminUser.isActive);

      console.log('\n🔐 Testing Admin Password:');
      const isPasswordValid = await adminUser.comparePassword('admin123');
      console.log('Password "admin123" is:', isPasswordValid ? '✅ VALID' : '❌ INVALID');

      // If password is invalid, update it with required fields
      if (!isPasswordValid) {
        console.log('\n🔧 Updating admin password to "admin123"...');
        adminUser.password = 'admin123';
        adminUser.firstName = adminUser.firstName || 'Admin';
        adminUser.lastName = adminUser.lastName || 'User';
        adminUser.gender = adminUser.gender || 'prefer-not-to-say';
        await adminUser.save();
        console.log('✅ Password updated and re-hashed with bcrypt');

        // Test the new password
        const testPass = await adminUser.comparePassword('admin123');
        console.log('Verification:', testPass ? '✅ Password now works!' : '❌ Still not working');
      }
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
};

checkUsers();
