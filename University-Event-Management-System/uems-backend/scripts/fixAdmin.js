const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const resetAdminPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const User = require('../models/User');
    
    // Find the admin user
    const admin = await User.findOne({ studentId: 'ADMIN001' });
    
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('🔍 Current admin details:');
    console.log('   Student ID:', admin.studentId);
    console.log('   Email:', admin.email);
    console.log('   Current password hash:', admin.password.substring(0, 30) + '...');
    
    // Manually set and hash the password
    console.log('🔄 Resetting password to "admin123"...');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    admin.password = hashedPassword;
    
    await admin.save();
    console.log('✅ Password reset successfully!');
    
    // Verify the new password works
    console.log('🧪 Verifying new password...');
    const updatedAdmin = await User.findOne({ studentId: 'ADMIN001' });
    const passwordMatch = await updatedAdmin.comparePassword('admin123');
    console.log('🔑 Password verification:', passwordMatch ? '✅ SUCCESS' : '❌ FAILED');
    
    if (passwordMatch) {
      console.log('\n🎉 ADMIN LOGIN SHOULD NOW WORK!');
      console.log('   Student ID: ADMIN001');
      console.log('   Password: admin123');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
};

resetAdminPassword();