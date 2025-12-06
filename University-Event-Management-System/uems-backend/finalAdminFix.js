const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const finalAdminFix = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const User = require('./models/User');
    
    // STEP 1: Completely remove existing admin
    await User.deleteMany({ studentId: 'ADMIN001' });
    console.log('🗑️  Removed existing admin users');
    
    // STEP 2: Create new admin with VERIFIED password
    console.log('🔐 Creating new admin with password: "admin123"');
    
    // Create user instance - let the pre-save hook hash the password
    const adminUser = new User({
      studentId: 'ADMIN001',
      email: 'admin@bicol-u.edu.ph',
      password: 'admin123', // This will be hashed by the pre-save hook
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin'
    });
    
    // STEP 3: Save and watch the pre-save hook
    console.log('💾 Saving admin user...');
    await adminUser.save();
    console.log('✅ Admin user saved');
    
    // STEP 4: Immediately verify the stored password
    const savedAdmin = await User.findOne({ studentId: 'ADMIN001' });
    console.log('🔍 Verifying stored admin:');
    console.log('   Student ID:', savedAdmin.studentId);
    console.log('   Email:', savedAdmin.email);
    console.log('   Password hash stored:', savedAdmin.password.substring(0, 30) + '...');
    
    // STEP 5: Test password comparison
    console.log('🧪 Testing password "admin123":');
    const test1 = await savedAdmin.comparePassword('admin123');
    console.log('   comparePassword result:', test1 ? '✅ SUCCESS' : '❌ FAILED');
    
    // STEP 6: Test direct bcrypt
    console.log('🧪 Testing direct bcrypt:');
    const test2 = await bcrypt.compare('admin123', savedAdmin.password);
    console.log('   bcrypt.compare result:', test2 ? '✅ SUCCESS' : '❌ FAILED');
    
    // STEP 7: Test wrong password
    console.log('🧪 Testing wrong password "wrongpass":');
    const test3 = await savedAdmin.comparePassword('wrongpass');
    console.log('   Wrong password result:', test3 ? '❌ UNEXPECTED SUCCESS' : '✅ EXPECTED FAIL');
    
    if (test1 && test2 && !test3) {
      console.log('\n🎉 🎉 🎉 ADMIN LOGIN SHOULD NOW WORK! 🎉 🎉 🎉');
      console.log('📋 CREDENTIALS:');
      console.log('   Student ID: ADMIN001');
      console.log('   Password: admin123');
      console.log('   Email: admin@bicol-u.edu.ph');
    } else {
      console.log('\n❌ Something is still wrong with password hashing');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.errors) {
      console.log('Validation errors:', error.errors);
    }
  }
};

finalAdminFix();