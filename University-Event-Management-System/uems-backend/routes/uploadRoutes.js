const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { auth } = require('../middleware/auth');
const { eventOwnership } = require('../middleware/eventOwnership');
const upload = require('../middleware/upload');

// @desc    Upload event media (banner/images/videos) - ADMIN + EVENT OWNER ONLY
// @route   POST /api/upload/events/:id/media
// @access  Private (Admin + Event Owner)
router.post(
  '/events/:id/media',
  auth,
  eventOwnership,
  upload.eventMedia.fields([
    { name: 'banner', maxCount: 1 },
    { name: 'images', maxCount: 10 },
    { name: 'videos', maxCount: 5 }
  ]),
  uploadController.uploadEventMedia
);

// @desc    Delete event media - ADMIN + EVENT OWNER ONLY  
// @route   DELETE /api/upload/events/:id/media/:mediaType/:filename
// @access  Private (Admin + Event Owner)
router.delete(
  '/events/:id/media/:mediaType/:filename',
  auth,
  eventOwnership,
  uploadController.deleteEventMedia
);

// @desc    Get event media info - ADMIN + EVENT OWNER ONLY
// @route   GET /api/upload/events/:id/media
// @access  Private (Admin + Event Owner)
router.get(
  '/events/:id/media',
  auth,
  eventOwnership,
  uploadController.getEventMedia
);

// TEST ROUTE - Remove after confirming everything works
router.delete(
  '/test/events/:id/media/:mediaType/:filename',
  auth, // Only auth, no eventOwnership
  (req, res) => {
    console.log('🔍 Test delete route hit!', {
      params: req.params,
      user: req.user
    });
    res.json({ 
      success: true, 
      message: 'Test route works!',
      data: { params: req.params, user: req.user._id }
    });
  }
);

module.exports = router;