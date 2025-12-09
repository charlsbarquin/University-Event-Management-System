const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        // Strict email validation: 
        // 1. Standard emails: ranolarod@gmail.com
        // 2. Bicol University emails: ranolarod@bicol-u.edu.ph
        // 3. Allows other educational domains too
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
          return false;
        }
        
        // Additional check for Bicol University format
        const buEmailRegex = /^[a-zA-Z0-9._%+-]+@bicol-u\.edu\.ph$/;
        const standardEmailRegex = /^[a-zA-Z0-9._%+-]+@(gmail|yahoo|outlook|hotmail|icloud|protonmail)\.(com|net|org|edu)$/i;
        const eduEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(edu|ac)\.[a-zA-Z]{2,}$/i;
        
        return buEmailRegex.test(email) || 
               standardEmailRegex.test(email) || 
               eduEmailRegex.test(email) ||
               /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.edu\.[a-zA-Z]{2,}$/i.test(email);
      },
      message: 'Please enter a valid email address. Accepted formats: name@gmail.com, name@bicol-u.edu.ph, or other educational emails.'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ['student', 'organizer', 'admin'],
    default: 'student'
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'prefer-not-to-say', 'other'],
    default: 'prefer-not-to-say'
  },
  profilePicture: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notifications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification'
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update role to organizer when event is approved
userSchema.methods.promoteToOrganizer = function() {
  this.role = 'organizer';
  return this.save();
};

// ✅ NEW: Add default gender for existing users
userSchema.post('init', function(doc) {
  if (!doc.gender) {
    doc.gender = 'prefer-not-to-say';
  }
});

module.exports = mongoose.model('User', userSchema);