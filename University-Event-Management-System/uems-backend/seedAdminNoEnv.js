// seedAdminNoEnv.js - Updated for Student ID login
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// YOUR NEW DATABASE CREDENTIALS
const MONGODB_URI = 'mongodb+srv://uems_app_user:SecurePass123!@cluster0.dya7caz.mongodb.net/uems_database?retryWrites=true&w=majority';

// ADMIN CREDENTIALS FOR YOUR APP (USING STUDENT ID)
const ADMIN_STUDENT_ID = 'ADMIN001';  // Changed from email to studentId
const ADMIN_PASSWORD = 'Admin@123456';
const ADMIN_EMAIL = 'admin@uems.com';  // Still needed for user record

const seedAdmin = async () => {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    console.log('User: uems_app_user');
    console.log('Cluster: cluster0.dya7caz.mongodb.net');
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 15000
    });
    
    console.log('✅ Connected to MongoDB Atlas');
    
    // Try to load existing User model or create simple one
    let User;
    try {
      User = require('./models/User');
      console.log('📦 Loaded existing User model');
    } catch {
      console.log('ℹ️ Creating simple User schema');
      const userSchema = new mongoose.Schema({
        name: String,
        email: String,
        studentId: { type: String, unique: true },  // Make sure studentId is unique
        password: String,
        role: String,
        department: String,
        year: String,
        phone: String,
        isVerified: Boolean
      });
      User = mongoose.model('User', userSchema);
    }
    
    // Check if admin exists by studentId
    const adminExists = await User.findOne({ studentId: ADMIN_STUDENT_ID });
    
    if (adminExists) {
      console.log('\n✅ Admin already exists!');
      console.log('Student ID:', adminExists.studentId);
      console.log('Email:', adminExists.email);
      console.log('Role:', adminExists.role);
      console.log('\n🔑 Login with:');
      console.log('   Student ID:', ADMIN_STUDENT_ID);
      console.log('   Password:', ADMIN_PASSWORD);
    } else {
      // Create admin with studentId
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);
      
      await User.create({
        name: 'System Administrator',
        email: ADMIN_EMAIL,
        studentId: ADMIN_STUDENT_ID,  // This is what you'll use to login
        password: hashedPassword,
        role: 'admin',
        department: 'Administration',
        year: 'N/A',
        phone: '000-000-0000',
        isVerified: true
      });
      
      console.log('\n✅ Admin created successfully!');
      console.log('================================');
      console.log('📋 Admin Details:');
      console.log('   Name: System Administrator');
      console.log('   Student ID:', ADMIN_STUDENT_ID);
      console.log('   Email:', ADMIN_EMAIL);
      console.log('   Role: admin');
      console.log('\n🔑 LOGIN CREDENTIALS:');
      console.log('   Student ID:', ADMIN_STUDENT_ID);
      console.log('   Password:', ADMIN_PASSWORD);
      console.log('\n⚠️  Use Student ID to login (not email!)');
    }
    
    // Show all users with studentId
    const allUsers = await User.find({});
    console.log('\n📊 All Users in Database:');
    console.log('============================');
    if (allUsers.length > 0) {
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.studentId || 'No ID'} - ${user.name || 'No name'} (${user.role})`);
      });
    } else {
      console.log('No users found.');
    }
    
    await mongoose.connection.close();
    console.log('\n👋 Done! Run: npm run dev');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 11000) {
      console.log('\n⚠️  Student ID already exists. Try a different Student ID.');
      console.log('Change ADMIN_STUDENT_ID in the script to something else.');
    }
    
    process.exit(1);
  }
};

seedAdmin();