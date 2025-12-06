const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { studentId, email, password, firstName, lastName, gender } = req.body;

    console.log('🔍 Registration attempt:', { studentId, email });

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ studentId }, { email }]
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
      email,
      password,
      firstName,
      lastName,
      gender: gender || 'prefer-not-to-say' // Optional gender
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
          gender: user.gender // Include gender in response
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
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
          gender: user.gender, // Include gender
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