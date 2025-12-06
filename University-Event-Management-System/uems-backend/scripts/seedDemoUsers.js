// seedDemoUsers.js - Add demo credentials for testing
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://uems_app_user:SecurePass123!@cluster0.dya7caz.mongodb.net/uems_database?retryWrites=true&w=majority';

// Demo user credentials
const DEMO_USERS = [
  {
    studentId: 'ADMIN001',
    email: 'admin@uems.com',
    password: 'admin123',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    gender: 'prefer-not-to-say'
  },
  {
    studentId: 'ORG001',
    email: 'organizer@uems.com',
    password: 'password123',
    role: 'organizer',
    firstName: 'Organizer',
    lastName: 'User',
    gender: 'prefer-not-to-say'
  },
  {
    studentId: 'STU001',
    email: 'student@uems.com',
    password: 'password123',
    role: 'student',
    firstName: 'Student',
    lastName: 'User',
    gender: 'prefer-not-to-say'
  }
];

const seedUsers = async () => {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 15000
    });
    
    console.log('✅ Connected to MongoDB Atlas\n');
    
    // Load User model
    const User = require('../models/User');
    
    console.log('📝 Creating demo users...\n');
    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const userData of DEMO_USERS) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ 
          $or: [
            { studentId: userData.studentId },
            { email: userData.email }
          ]
        });
        
        if (existingUser) {
          console.log(`⏭️  Skipped ${userData.studentId} - Already exists`);
          skippedCount++;
        } else {
          // Create new user
          const newUser = await User.create(userData);
          console.log(`✅ Created ${userData.studentId} (${userData.role})`);
          createdCount++;
        }
      } catch (error) {
        console.error(`❌ Error creating ${userData.studentId}:`, error.message);
      }
    }
    
    console.log(`\n📊 Results:`);
    console.log(`   Created: ${createdCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    
    // Display login credentials
    console.log(`\n🔑 Demo Login Credentials:`);
    console.log(`============================`);
    console.log(`\n📌 Admin Account:`);
    console.log(`   Student ID: ADMIN001`);
    console.log(`   Password: admin123`);
    console.log(`   Email: admin@uems.com\n`);
    
    console.log(`📌 Organizer Account:`);
    console.log(`   Student ID: ORG001`);
    console.log(`   Password: password123`);
    console.log(`   Email: organizer@uems.com\n`);
    
    console.log(`📌 Student Account:`);
    console.log(`   Student ID: STU001`);
    console.log(`   Password: password123`);
    console.log(`   Email: student@uems.com\n`);
    
    // Get all users count
    const totalUsers = await User.countDocuments();
    console.log(`📊 Total users in database: ${totalUsers}`);
    
    await mongoose.disconnect();
    console.log('\n✅ Demo users setup complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedUsers();
