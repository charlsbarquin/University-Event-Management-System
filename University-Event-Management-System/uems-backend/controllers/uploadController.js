const Event = require('../models/Event');
const path = require('path');
const fs = require('fs');

// Helper function to get correct upload path
function getUploadPath(folder, filename) {
  // Remove any leading slash or "uploads/" prefix from filename
  const cleanFilename = filename.replace(/^\/?uploads\/[^\/]+\//, '');
  console.log(`📁 Cleaned filename: "${filename}" -> "${cleanFilename}"`);
  return path.join(__dirname, '../uploads', folder, cleanFilename);
}

// @desc    Upload event media (banner/images/videos) - ADMIN + EVENT OWNER ONLY
// @route   POST /api/upload/events/:id/media
// @access  Private (Admin + Event Owner)
exports.uploadEventMedia = async (req, res) => {
  try {
    console.log('Upload request received:', {
      eventId: req.params.id,
      mediaType: req.body.mediaType,
      files: req.files ? Object.keys(req.files) : 'none',
      user: req.user ? req.user._id : 'no user'
    });

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check permissions: Admin or Event Owner/Creator
    const isAdmin = req.user.role === 'admin';
    const isOrganizer = event.organizer && event.organizer.toString() === req.user._id.toString();
    const isCreator = event.creator && event.creator.toString() === req.user._id.toString();
    
    console.log('🔍 Permission check:', {
      userId: req.user._id,
      userRole: req.user.role,
      eventOrganizer: event.organizer,
      eventCreator: event.creator,
      isAdmin,
      isOrganizer,
      isCreator
    });
    
    if (!isAdmin && !isOrganizer && !isCreator) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload media for this event'
      });
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadedFiles = [];
    const mediaType = req.body.mediaType; // 'banner', 'images', 'videos'

    // Handle banner upload
    if (mediaType === 'banner' && req.files.banner) {
      const bannerFile = req.files.banner[0];
      console.log('Banner file:', {
        originalname: bannerFile.originalname,
        filename: bannerFile.filename,
        size: bannerFile.size,
        mimetype: bannerFile.mimetype
      });
      
      // Consistent path format
      event.bannerImage = `/uploads/event-banners/${bannerFile.filename}`;
      uploadedFiles.push({
        type: 'banner',
        url: event.bannerImage,
        filename: bannerFile.filename
      });
    }

    // Handle multiple images
    if (mediaType === 'images' && req.files.images) {
      const imageFiles = req.files.images.map(file => {
        console.log('Image file:', {
          originalname: file.originalname,
          filename: file.filename,
          size: file.size,
          mimetype: file.mimetype
        });
        
        return {
          url: `/uploads/event-images/${file.filename}`,
          caption: req.body.caption || '',
          uploadedAt: new Date()
        };
      });
      event.images.push(...imageFiles);
      uploadedFiles.push(...imageFiles.map(img => ({
        type: 'image',
        url: img.url,
        filename: path.basename(img.url)
      })));
    }

    // Handle multiple videos
    if (mediaType === 'videos' && req.files.videos) {
      const videoFiles = req.files.videos.map(file => {
        console.log('Video file:', {
          originalname: file.originalname,
          filename: file.filename,
          size: file.size,
          mimetype: file.mimetype
        });
        
        return {
          url: `/uploads/event-videos/${file.filename}`,
          title: req.body.title || path.parse(file.originalname).name,
          uploadedAt: new Date()
        };
      });
      event.videos.push(...videoFiles);
      uploadedFiles.push(...videoFiles.map(vid => ({
        type: 'video',
        url: vid.url,
        filename: path.basename(vid.url)
      })));
    }

    await event.save({ validateBeforeSave: false });

    console.log('Upload successful:', {
      eventId: event._id,
      uploadedFiles: uploadedFiles.length,
      bannerImage: event.bannerImage,
      imagesCount: event.images.length,
      videosCount: event.videos.length
    });

    res.json({
      success: true,
      message: 'Event media uploaded successfully',
      data: {
        eventId: event._id,
        uploadedFiles,
        mediaType
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uploading media',
      error: error.message
    });
  }
};

// @desc    Delete event media - ADMIN + EVENT OWNER ONLY
// @route   DELETE /api/upload/events/:id/media/:mediaType/:filename
// @access  Private (Admin + Event Owner)
exports.deleteEventMedia = async (req, res) => {
  try {
    console.log('🔍 DELETE REQUEST RECEIVED - FULL DETAILS:', {
      method: req.method,
      url: req.url,
      params: req.params,
      body: req.body,
      query: req.query,
      user: req.user ? req.user._id : 'no user',
      userRole: req.user?.role,
      headers: req.headers
    });

    const { id: eventId, mediaType, filename } = req.params;
    
    console.log('Delete parameters:', { eventId, mediaType, filename });

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check permissions: Admin or Event Owner/Creator
    const isAdmin = req.user.role === 'admin';
    const isOrganizer = event.organizer && event.organizer.toString() === req.user._id.toString();
    const isCreator = event.creator && event.creator.toString() === req.user._id.toString();

    console.log('🔍 Permission check:', {
      userId: req.user._id,
      userRole: req.user.role,
      eventOrganizer: event.organizer,
      eventCreator: event.creator,
      isAdmin,
      isOrganizer,
      isCreator,
      organizerMatch: event.organizer ? event.organizer.toString() === req.user._id.toString() : false,
      creatorMatch: event.creator ? event.creator.toString() === req.user._id.toString() : false
    });

    if (!isAdmin && !isOrganizer && !isCreator) {
      console.log('❌ Permission denied for user:', req.user._id);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete media from this event'
      });
    }

    console.log('✅ Permission granted. Processing delete for:', { mediaType, filename });

    // Clean the filename first
    const cleanFilename = filename.replace(/^\/?uploads\/[^\/]+\//, '');
    console.log(`📁 Using cleaned filename: "${cleanFilename}"`);

    let fileDeleted = false;
    let dbUpdated = false;

    if (mediaType === 'banner' && event.bannerImage) {
      const bannerFilename = path.basename(event.bannerImage);
      console.log(`Comparing banner filenames: "${bannerFilename}" vs "${cleanFilename}"`);
      
      if (bannerFilename === cleanFilename) {
        const filePath = getUploadPath('event-banners', cleanFilename);
        console.log('Banner delete path:', filePath);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('✅ Banner file deleted from disk:', cleanFilename);
          fileDeleted = true;
        } else {
          console.log('⚠️ Banner file not found on disk:', cleanFilename);
        }
        
        event.bannerImage = null;
        dbUpdated = true;
      } else {
        console.log('❌ Banner filename mismatch');
      }
    }

    if (mediaType === 'image') {
      const imageIndex = event.images.findIndex(img => {
        const imgFilename = path.basename(img.url);
        return imgFilename === cleanFilename;
      });
      
      if (imageIndex !== -1) {
        const filePath = getUploadPath('event-images', cleanFilename);
        console.log('Image delete path:', filePath);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('✅ Image file deleted from disk:', cleanFilename);
          fileDeleted = true;
        } else {
          console.log('⚠️ Image file not found on disk:', cleanFilename);
        }
        
        event.images.splice(imageIndex, 1);
        dbUpdated = true;
      } else {
        console.log('❌ Image not found in event.images array:', cleanFilename);
        // Try to find by partial match
        console.log('Available images:', event.images.map(img => path.basename(img.url)));
      }
    }

    if (mediaType === 'video') {
      const videoIndex = event.videos.findIndex(vid => {
        const vidFilename = path.basename(vid.url);
        return vidFilename === cleanFilename;
      });
      
      if (videoIndex !== -1) {
        const filePath = getUploadPath('event-videos', cleanFilename);
        console.log('Video delete path:', filePath);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('✅ Video file deleted from disk:', cleanFilename);
          fileDeleted = true;
        } else {
          console.log('⚠️ Video file not found on disk:', cleanFilename);
        }
        
        event.videos.splice(videoIndex, 1);
        dbUpdated = true;
      } else {
        console.log('❌ Video not found in event.videos array:', cleanFilename);
      }
    }

    try {
      if (dbUpdated) {
        await event.save({ validateBeforeSave: false });
        console.log('✅ Database updated successfully:', {
          bannerImage: event.bannerImage,
          imagesCount: event.images.length,
          videosCount: event.videos.length
        });
      }
    } catch (saveError) {
      console.error('❌ Error saving event after delete:', saveError.message);
    }

    res.json({
      success: true,
      message: 'Event media deleted successfully',
      data: { 
        eventId: event._id, 
        deletedFile: cleanFilename,
        fileDeleted,
        dbUpdated,
        updatedEvent: {
          bannerImage: event.bannerImage,
          images: event.images,
          videos: event.videos
        }
      }
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting media',
      error: error.message
    });
  }
};

// @desc    Get event media info - ADMIN + EVENT OWNER ONLY
// @route   GET /api/upload/events/:id/media
// @access  Private (Admin + Event Owner)
exports.getEventMedia = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const isAdmin = req.user.role === 'admin';
    const isOrganizer = event.organizer && event.organizer.toString() === req.user._id.toString();
    const isCreator = event.creator && event.creator.toString() === req.user._id.toString();
    
    if (!isAdmin && !isOrganizer && !isCreator) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view media for this event'
      });
    }

    const mediaInfo = {
      banner: event.bannerImage ? {
        url: event.bannerImage,
        filename: path.basename(event.bannerImage),
        fullUrl: `http://localhost:5000${event.bannerImage}`
      } : null,
      images: event.images ? event.images.map(img => ({
        url: img.url,
        filename: path.basename(img.url),
        fullUrl: `http://localhost:5000${img.url}`,
        caption: img.caption,
        uploadedAt: img.uploadedAt
      })) : [],
      videos: event.videos ? event.videos.map(vid => ({
        url: vid.url,
        filename: path.basename(vid.url),
        fullUrl: `http://localhost:5000${vid.url}`,
        title: vid.title,
        uploadedAt: vid.uploadedAt
      })) : []
    };

    res.json({
      success: true,
      data: {
        eventId: event._id,
        media: mediaInfo,
        counts: {
          banner: event.bannerImage ? 1 : 0,
          images: event.images ? event.images.length : 0,
          videos: event.videos ? event.videos.length : 0
        }
      }
    });
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting media info',
      error: error.message
    });
  }
};