const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareController');
const { auth, adminAuth } = require('../middleware/auth');
const { eventOwnership } = require('../middleware/eventOwnership');

router.get('/events/:id', auth, shareController.generateShareLinks);
router.get('/events/:id/redirect', shareController.trackShareClick);
router.get('/events/:id/analytics', auth, eventOwnership, shareController.getShareAnalytics);
router.post('/bulk', auth, adminAuth, shareController.bulkShareEvents); // Already correct

module.exports = router;