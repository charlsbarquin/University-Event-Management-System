const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      req.user = null;
      return next();
    }

    req.user = user;
    next();
  } catch (error) {
    // ✅ CRITICAL: For ALL JWT errors, just set req.user = null and continue
    // Don't throw errors that would break the auth check
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      req.user = null;
      return next();
    }
    
    console.error('Auth middleware error:', error);
    req.user = null;
    next();
  }
};

const adminAuth = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
};

module.exports = { auth, adminAuth };