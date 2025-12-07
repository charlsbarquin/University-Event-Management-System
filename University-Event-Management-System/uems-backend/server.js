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

// ✅ UPDATED FOR RENDER: CORS Configuration for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://uems-frontend.onrender.com',
      'https://uems-frontend-*.onrender.com',
      'http://localhost:3000',
      'http://localhost:5173',
      process.env.CLIENT_URL
    ].filter(Boolean);
    
    if (allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        const pattern = allowedOrigin.replace('*', '.*');
        return new RegExp(pattern).test(origin);
      }
      return origin === allowedOrigin;
    })) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// ✅ CRITICAL FIX: Handle OPTIONS preflight for ALL routes
app.options('*', cors(corsOptions));

// Security headers for production
if (process.env.NODE_ENV === 'production') {
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false // You can configure this later
  }));
} else {
  app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false
  }));
}

// Body Parsing Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ✅ UPDATED: Static files with proper CORS and cache control
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    // Cache static files for 1 year in production
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }
}));

// ✅ UPDATED: Rate Limiting optimized for Render
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => {
    // Skip rate limiting for health checks and static files
    if (req.path === '/api/health' || req.path === '/') return true;
    if (req.path.startsWith('/uploads/')) return true;
    if (req.path === '/test-cors') return true;
    return false;
  },
  keyGenerator: (req) => {
    // Use IP + user agent for better rate limiting
    return req.ip + '-' + (req.headers['user-agent'] || '');
  }
});

// Apply rate limiting to API routes only
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
    version: '1.0.0',
    nodeVersion: process.version,
    platform: process.platform
  });
});

// Enhanced CORS test endpoint
app.get('/test-cors', (req, res) => {
  res.json({
    success: true,
    message: 'CORS test endpoint - Accessible from allowed origins',
    allowedOrigins: [
      'https://uems-frontend.onrender.com',
      'http://localhost:3000',
      'http://localhost:5173'
    ],
    yourOrigin: req.headers.origin || 'No origin header',
    timestamp: new Date().toISOString()
  });
});

// Enhanced debug route
app.get('/debug', (req, res) => {
  res.json({
    success: true,
    message: 'Debug endpoint',
    environment: process.env.NODE_ENV || 'development',
    clientUrl: process.env.CLIENT_URL,
    corsOrigin: process.env.CORS_ORIGIN || 'https://uems-frontend.onrender.com',
    port: process.env.PORT || 5000,
    mongodb: process.env.MONGODB_URI ? 'Configured' : 'Not configured',
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
    },
    headers: {
      origin: req.headers.origin,
      host: req.headers.host,
      'user-agent': req.headers['user-agent']
    }
  });
});

// Basic route for health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'University Event Management System (UEMS) Backend API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    documentation: {
      health: '/api/health',
      debug: '/debug',
      corsTest: '/test-cors',
      apiBase: '/api'
    }
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
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      '/api/health',
      '/api/auth/*',
      '/api/events/*',
      '/api/events/proposals/*',
      '/api/admin/*',
      '/api/notifications/*',
      '/api/share/*',
      '/api/upload/*'
    ]
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  
  // Don't log stack in production for security
  if (process.env.NODE_ENV !== 'production') {
    console.error('Stack:', err.stack);
  }
  
  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS Error: Your origin is not allowed to access this resource.'
    });
  }
  
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
      message: 'File too large. Maximum file size is 10MB.'
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file field. Please check your file upload.'
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : err.message || 'Internal Server Error'
  };
  
  // Add stack trace only in development
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response.stack = err.stack;
  }
  
  res.status(statusCode).json(response);
});

// Start server
const PORT = process.env.PORT || 10000; // Render uses port 10000 by default
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 UEMS Backend Server running!
📊 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Port: ${PORT}
🔗 CORS Origins: ${process.env.CORS_ORIGIN || 'https://uems-frontend.onrender.com'}
📦 MongoDB: ${process.env.MONGODB_URI ? 'Connected' : 'Not configured'}
⚠️  Rate limiting: ${parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100} requests/${parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000}ms
🔍 Health check: http://localhost:${PORT}/api/health
🔍 Debug: http://localhost:${PORT}/debug
📝 API Documentation: http://localhost:${PORT}/
  `);
});