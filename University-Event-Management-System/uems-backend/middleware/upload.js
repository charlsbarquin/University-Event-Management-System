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
      console.log(`📁 Created directory: ${dir}`);
    }
  });
};

// Ensure directories exist on startup
ensureDirectories();

// ✅ FIXED: Always use DISK storage for localhost development
const getStorage = (folder) => {
  console.log(`📁 Using DISK storage for ${folder}`);
  
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, '../uploads', folder);
      
      // Ensure directory exists
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
        console.log(`📁 Created upload directory: ${uploadPath}`);
      }
      
      console.log(`📁 Saving to: ${uploadPath}`);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // Create unique filename with event ID and timestamp
      const eventId = req.params.id || 'unknown';
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const filename = `event-${eventId}-${uniqueSuffix}${ext}`;
      
      console.log(`📁 Generated filename: ${filename} for ${file.originalname}`);
      cb(null, filename);
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
    console.log(`✅ File accepted: ${file.originalname} (${file.mimetype})`);
    cb(null, true);
  } else {
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes].join(', ');
    console.log(`❌ File rejected: ${file.originalname} (${file.mimetype})`);
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

// Export multiple upload configurations - REMOVED eventMedia which doesn't exist!
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
  })
};

// ✅ CRITICAL FIX: Add eventMedia that properly routes files to correct folders
upload.eventMedia = multer({
  ...uploadConfig,
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      let folder = 'event-images'; // default
      
      if (file.fieldname === 'banner') {
        folder = 'event-banners';
      } else if (file.fieldname === 'images') {
        folder = 'event-images';
      } else if (file.fieldname === 'videos') {
        folder = 'event-videos';
      }
      
      const uploadPath = path.join(__dirname, '../uploads', folder);
      
      // Ensure directory exists
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
        console.log(`📁 Created upload directory: ${uploadPath}`);
      }
      
      console.log(`📁 eventMedia: Saving ${file.fieldname} to ${uploadPath}`);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const eventId = req.params.id || 'unknown';
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const filename = `event-${eventId}-${uniqueSuffix}${ext}`;
      
      console.log(`📁 eventMedia: Generated filename: ${filename} for ${file.fieldname}`);
      cb(null, filename);
    }
  })
});

module.exports = upload;