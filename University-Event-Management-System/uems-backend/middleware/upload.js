// backend/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create directories if they don't exist with ABSOLUTE paths
const ensureDirectories = () => {
  const baseDir = path.join(__dirname, '../uploads');
  const directories = [
    path.join(baseDir, 'event-banners'),
    path.join(baseDir, 'event-images'), 
    path.join(baseDir, 'event-videos')
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Ensure directories exist on startup
ensureDirectories();

// ✅ UPDATED FOR RENDER: Use memory storage for production
const getStorage = (folder) => {
  if (process.env.NODE_ENV === 'production') {
    // Use memory storage for Render (filesystem is ephemeral)
    console.log(`📁 Using memory storage for ${folder} (production mode)`);
    return multer.memoryStorage();
  }
  
  // Use disk storage for development
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, '../uploads', folder);
      // Ensure directory exists
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // Create unique filename with event ID and timestamp
      const eventId = req.params.id || 'unknown';
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      
      // Format: event-[id]-[timestamp]-[random].ext
      cb(null, `event-${eventId}-${uniqueSuffix}${ext}`);
    }
  });
};

// File filter with proper MIME type validation
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = process.env.UPLOAD_ALLOWED_IMAGE_TYPES?.split(',') || [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/gif',
    'image/webp'
  ];
  
  const allowedVideoTypes = process.env.UPLOAD_ALLOWED_VIDEO_TYPES?.split(',') || [
    'video/mp4',
    'video/mkv', 
    'video/avi',
    'video/mov',
    'video/webm'
  ];

  const isImage = allowedImageTypes.includes(file.mimetype);
  const isVideo = allowedVideoTypes.includes(file.mimetype);

  if (isImage || isVideo) {
    cb(null, true);
  } else {
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes].join(', ');
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes}`), false);
  }
};

// Create upload configurations
const uploadConfig = {
  limits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE) || 10485760 // 10MB default
  },
  fileFilter: fileFilter
};

// Export multiple upload configurations
const upload = {
  // For event banners (single file)
  banner: multer({
    ...uploadConfig,
    storage: getStorage('event-banners')
  }),

  // For event images (multiple files)
  images: multer({
    ...uploadConfig,
    storage: getStorage('event-images')
  }),

  // For event videos (multiple files)  
  videos: multer({
    ...uploadConfig,
    storage: getStorage('event-videos')
  }),

  // Combined for all event media types
  eventMedia: multer({
    ...uploadConfig,
    storage: multer.memoryStorage() // Always memory storage for combined
  })
};

// ✅ ADDED: Helper function to handle file saving based on environment
const saveUploadedFile = (fileBuffer, originalName, folder) => {
  if (process.env.NODE_ENV === 'production') {
    // In production (Render), return file buffer for cloud storage
    // You should integrate cloud storage here (S3, Cloudinary, etc.)
    console.log(`⚠️  File upload in production mode - Consider implementing cloud storage for: ${originalName}`);
    return {
      buffer: fileBuffer,
      originalname: originalName,
      size: fileBuffer.length,
      uploadedAt: new Date().toISOString(),
      storage: 'memory'
    };
  }
  
  // In development, save to disk
  const uploadPath = path.join(__dirname, '../uploads', folder);
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = path.extname(originalName);
  const filename = `file-${uniqueSuffix}${ext}`;
  const filepath = path.join(uploadPath, filename);
  
  fs.writeFileSync(filepath, fileBuffer);
  
  return {
    path: filepath,
    filename: filename,
    url: `/uploads/${folder}/${filename}`,
    size: fileBuffer.length,
    uploadedAt: new Date().toISOString(),
    storage: 'disk'
  };
};

// ✅ ADDED: Cleanup function for temporary files
const cleanupTempFiles = () => {
  if (process.env.NODE_ENV === 'production') return;
  
  const baseDir = path.join(__dirname, '../uploads');
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  const now = Date.now();
  
  const cleanupDirectory = (dir) => {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`🧹 Cleaned up old file: ${filePath}`);
      }
    });
  };
  
  // Clean up all upload directories
  ['event-banners', 'event-images', 'event-videos'].forEach(folder => {
    cleanupDirectory(path.join(baseDir, folder));
  });
};

// Run cleanup on startup
cleanupTempFiles();

// Export the helper functions as well
module.exports = {
  ...upload,
  saveUploadedFile,
  cleanupTempFiles
};