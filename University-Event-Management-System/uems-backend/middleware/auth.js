const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      req.user = null;  // ✅ Allow public access
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      req.user = null;  // ✅ Allow public access
      return next();
    }

    req.user = user;
    next();
  } catch (error) {
    // ✅ Don't log JWT errors for expired tokens - just treat as no user
    if (error.name === 'TokenExpiredError') {
      // Token expired, but don't clear it - let frontend handle refresh
      req.user = null;
      return next();
    } else if (error.name === 'JsonWebTokenError') {
      // Invalid token
      req.user = null;
      return next();
    }
    
    // Other errors
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