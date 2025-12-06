const mongoose = require('mongoose');
require('dotenv').config();

const debugRolePromotion = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Event = require('./models/Event');
    const User = require('./models/User');
    
    // Check the approved event
    const event = await Event.findOne({ status: 'approved' });
    console.log('🔍 Event:');
    console.log('   ID:', event?._id);
    console.log('   Creator (ObjectId):', event?.creator);
    console.log('   Organizer (ObjectId):', event?.organizer);
    
    // Check the user
    const user = await User.findById(event?.creator);
    console.log('👤 User:');
    console.log('   ID:', user?._id);
    console.log('   Student ID:', user?.studentId);
    console.log('   Current Role:', user?.role);
    
    // Test the promoteToOrganizer method directly
    if (user) {
      console.log('🧪 Testing promoteToOrganizer method...');
      console.log('   Before - Role:', user.role);
      await user.promoteToOrganizer();
      
      // Refetch to see changes
      const updatedUser = await User.findById(user._id);
      console.log('   After - Role:', updatedUser.role);
      console.log('   Method worked?', updatedUser.role === 'organizer');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
};

debugRolePromotion();