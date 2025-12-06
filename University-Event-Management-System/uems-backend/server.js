const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const eventProposalRoutes = require('./routes/eventProposalRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const shareRoutes = require('./routes/shareRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Import database connection
const connectDB = require('./config/database');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// ✅ FIXED: Disable helmet for development to avoid CORS issues
if (process.env.NODE_ENV === 'production') {
  app.use(helmet());
} else {
  app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false
  }));
}

// ✅ CRITICAL FIX: CORS Configuration - Simple for development
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ CRITICAL FIX: Handle OPTIONS preflight for ALL routes
app.options('*', cors());

// Body Parsing Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ✅ FIXED: Static files with proper CORS
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ FIXED: Rate Limiting - Development-friendly settings
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // 1000 requests per minute
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // ✅ ADD CORS headers to rate limit responses
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
  // ✅ Skip rate limiting for certain requests in development
  skip: (req, res) => {
    // Skip for static files
    if (req.path.startsWith('/uploads/')) return true;
    // Skip for health checks
    if (req.path === '/api/health') return true;
    return false;
  }
});

// ✅ FIXED: Apply rate limiting ONLY to API routes
app.use('/api/', limiter);

// Test endpoint for images
app.get('/test-image/:filename', (req, res) => {
  const fs = require('fs');
  const filePath = path.join(__dirname, 'uploads', 'event-images', req.params.filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({
      success: false,
      message: 'File not found'
    });
  }
});

// Health check endpoint (no rate limiting)
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'UEMS Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000
    }
  });
});

// CORS test endpoint
app.get('/test-cors', (req, res) => {
  res.json({
    success: true,
    message: 'CORS test endpoint',
    headers: req.headers
  });
});

// Debug route
app.get('/debug', (req, res) => {
  res.json({
    success: true,
    message: 'Debug endpoint',
    environment: process.env.NODE_ENV,
    clientUrl: process.env.CLIENT_URL,
    corsOrigin: process.env.CLIENT_URL || 'http://localhost:3000',
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS),
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
    }
  });
});

// Basic route for health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'University Event Management System (UEMS) Backend API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/events/proposals', eventProposalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/upload', uploadRoutes);

// 404 Handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  console.error('Stack:', err.stack);
  
  // Rate limit errors
  if (err.statusCode === 429) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.'
    });
  }
  
  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Please upload a smaller file.'
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file field. Please check your file upload.'
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 UEMS Backend Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
  console.log(`⚠️  Rate limiting: ${parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000} requests/minute`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Debug: http://localhost:${PORT}/debug`);
});