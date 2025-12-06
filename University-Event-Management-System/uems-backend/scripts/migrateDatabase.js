const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../models/User');

const migrateDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🗄️ Connected to MongoDB');

    // 1. Delete all users (clean start)
    const deleteResult = await User.deleteMany({});
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} existing users`);

    // 2. Create admin user
    const adminUser = await User.create({
      studentId: 'ADMIN001',
      email: 'admin@bu.edu.ph',
      password: 'admin123',
      firstName: 'System',
      lastName: 'Administrator',
      gender: 'male',
      role: 'admin'
    });
    console.log('✅ Admin created: ADMIN001 / admin123');

    // 3. Create organizer
    const organizerUser = await User.create({
      studentId: 'ORG001',
      email: 'organizer@bu.edu.ph',
      password: 'password123',
      firstName: 'John',
      lastName: 'Organizer',
      gender: 'male',
      role: 'organizer'
    });
    console.log('✅ Organizer created: ORG001 / password123');

    // 4. Create students with different genders
    const student1 = await User.create({
      studentId: 'STU001',
      email: 'student@bu.edu.ph',
      password: 'password123',
      firstName: 'Maria',
      lastName: 'Student',
      gender: 'female',
      role: 'student'
    });
    console.log('✅ Student 1 created: STU001 / password123 (female)');

    const student2 = await User.create({
      studentId: 'STU002',
      email: 'student2@bu.edu.ph',
      password: 'password123',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      gender: 'male',
      role: 'student'
    });
    console.log('✅ Student 2 created: STU002 / password123 (male)');

    const student3 = await User.create({
      studentId: 'STU003',
      email: 'student3@bu.edu.ph',
      password: 'password123',
      firstName: 'Alex',
      lastName: 'Taylor',
      gender: 'other',
      role: 'student'
    });
    console.log('✅ Student 3 created: STU003 / password123 (other)');

    console.log('\n🎉 Database migration complete!');
    console.log('👤 Total users created: 5');
    console.log('\n🔑 Login Credentials:');
    console.log('   Admin: ADMIN001 / admin123');
    console.log('   Organizer: ORG001 / password123');
    console.log('   Students: STU001-STU003 / password123');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
};

migrateDatabase();