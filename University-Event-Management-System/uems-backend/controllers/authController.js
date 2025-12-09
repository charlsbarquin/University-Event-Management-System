const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Helper function for email validation (same as model validation)
const validateEmail = (email) => {
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
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { studentId, email, password, firstName, lastName, gender } = req.body;

    console.log('🔍 Registration attempt:', { studentId, email });

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address. Accepted formats: name@gmail.com, name@bicol-u.edu.ph, or other educational emails.'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ studentId }, { email: email.toLowerCase() }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this Student ID or Email already exists'
      });
    }

    // Create user (role defaults to 'student')
    const user = await User.create({
      studentId,
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      gender: gender || 'prefer-not-to-say'
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          _id: user._id,
          studentId: user.studentId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          gender: user.gender
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle Mongoose validation errors specifically
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
        error: 'Validation Error'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { studentId, password } = req.body;

    console.log('🔑 Login attempt for:', studentId);

    // Find user by studentId
    const user = await User.findOne({ studentId });
    if (!user) {
      console.log('❌ User not found:', studentId);
      return res.status(401).json({
        success: false,
        message: 'Invalid Student ID or Password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log('❌ Invalid password for:', studentId);
      return res.status(401).json({
        success: false,
        message: 'Invalid Student ID or Password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // Ensure gender field exists (for backward compatibility)
    if (!user.gender) {
      user.gender = 'prefer-not-to-say';
      await user.save();
    }

    // Generate token
    const token = generateToken(user._id);

    console.log('✅ Login successful for:', studentId);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          _id: user._id,
          studentId: user.studentId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          gender: user.gender,
          profilePicture: user.profilePicture
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('notifications', 'title message isRead createdAt');

    // Ensure gender field exists
    if (!user.gender) {
      user.gender = 'prefer-not-to-say';
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching user data',
      error: error.message
    });
  }
};