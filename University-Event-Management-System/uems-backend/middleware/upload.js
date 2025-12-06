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

// Configure storage for different media types
const createStorage = (folder) => {
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
    cb(new Error(`Invalid file type. Allowed: images (${allowedImageTypes.join(', ')}) and videos (${allowedVideoTypes.join(', ')})`), false);
  }
};

// Create separate upload configurations for each media type
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
    storage: createStorage('event-banners')
  }),

  // For event images (multiple files)
  images: multer({
    ...uploadConfig,
    storage: createStorage('event-images')
  }),

  // For event videos (multiple files)  
  videos: multer({
    ...uploadConfig,
    storage: createStorage('event-videos')
  }),

  // Combined for all event media types (used in our routes)
  eventMedia: multer({
    ...uploadConfig,
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        // Determine folder based on field name
        let folder = 'event-images'; // default
        
        if (file.fieldname === 'banner') {
          folder = 'event-banners';
        } else if (file.fieldname === 'videos') {
          folder = 'event-videos';
        }
        
        const uploadPath = path.join(__dirname, '../uploads', folder);
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const eventId = req.params.id || 'unknown';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        
        cb(null, `event-${eventId}-${file.fieldname}-${uniqueSuffix}${ext}`);
      }
    })
  })
};

module.exports = upload;